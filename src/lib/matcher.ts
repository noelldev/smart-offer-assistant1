import Fuse from 'fuse.js';
import { CatalogueItem, MatchResult, Catalogue, Trade, Position } from '@/types';
import { extractTokens, normalizeText, createSearchableText } from './normalizer';

/**
 * Scoring weights - documented as required
 *
 * SCORING FORMULA:
 * score = (W_KEYWORD * keywordScore) + (W_FUZZY * fuzzyScore) + (W_CATEGORY * categoryBoost)
 *
 * Where:
 * - keywordScore: (matchedKeywords / totalTokens) * 100
 * - fuzzyScore: (1 - fuseScore) * 100 (Fuse returns 0=perfect, 1=no match)
 * - categoryBoost: 100 if category matches boost condition, else 0
 */
const W_KEYWORD = 0.4;   // 40% weight for exact keyword matches
const W_FUZZY = 0.4;     // 40% weight for fuzzy proximity
const W_CATEGORY = 0.2;  // 20% weight for category boost

// Category code for scaffolding (boosted when difficultAccess is true)
const SCAFFOLDING_CATEGORY = '0300';

// Default number of results to return
const TOP_N = 15;

/**
 * Flattens the nested catalogue structure into a searchable array
 */
export function flattenCatalogue(catalogue: Catalogue): CatalogueItem[] {
  const items: CatalogueItem[] = [];

  for (const trade of catalogue.trades) {
    for (const position of trade.positions) {
      items.push({
        position: position.position_number,
        shortName: position.short_name_en,
        unit: position.unit,
        description: position.description_en,
        category: trade.code,
        categoryName: trade.name_en,
        tags: extractTagsFromPosition(position, trade),
        hero: position.hero,
      });
    }
  }

  return items;
}

/**
 * Extracts searchable tags from a position
 */
function extractTagsFromPosition(position: Position, trade: Trade): string[] {
  const text = `${position.short_name_en} ${position.description_en} ${trade.name_en}`;
  return extractTokens(text);
}

/**
 * Calculates keyword overlap score
 * Returns percentage of intake tokens found in item
 */
function calculateKeywordScore(
  intakeTokens: string[],
  itemTags: string[],
  itemSearchText: string
): { score: number; matchedKeywords: string[] } {
  if (intakeTokens.length === 0) {
    return { score: 0, matchedKeywords: [] };
  }

  const matchedKeywords: string[] = [];
  const normalizedItemText = normalizeText(itemSearchText);

  for (const token of intakeTokens) {
    // Check if token exists in tags or searchable text
    const inTags = itemTags.some(tag =>
      tag.includes(token) || token.includes(tag)
    );
    const inText = normalizedItemText.includes(token);

    if (inTags || inText) {
      matchedKeywords.push(token);
    }
  }

  const score = (matchedKeywords.length / intakeTokens.length) * 100;
  return { score, matchedKeywords };
}

/**
 * Main matching function
 *
 * Algorithm:
 * 1. Normalize intake text and extract tokens
 * 2. For each catalogue item:
 *    - Calculate keyword overlap score
 *    - Calculate fuzzy proximity score (Fuse.js)
 *    - Apply category boost if applicable
 *    - Combine scores with weights
 * 3. De-duplicate by position
 * 4. Sort by score descending
 * 5. Return top N results with "why" explanation
 */
export function matchServices(
  description: string,
  difficultAccess: boolean,
  catalogue: CatalogueItem[],
  topN: number = TOP_N
): MatchResult[] {
  // Step 1: Extract tokens from intake
  const intakeTokens = extractTokens(description);

  if (intakeTokens.length === 0) {
    return [];
  }

  // Set up Fuse.js for fuzzy matching
  const fuse = new Fuse(catalogue, {
    keys: ['shortName', 'description', 'categoryName', 'tags'],
    includeScore: true,
    threshold: 0.6, // Allow fairly loose matches
    ignoreLocation: true,
  });

  // Get fuzzy search results
  const fuseResults = fuse.search(description);
  const fuseScoreMap = new Map<string, number>();
  for (const result of fuseResults) {
    // Fuse score: 0 = perfect match, 1 = no match
    // Convert to 0-100 where 100 is best
    const normalizedScore = (1 - (result.score ?? 1)) * 100;
    fuseScoreMap.set(result.item.position, normalizedScore);
  }

  // Step 2: Score each catalogue item
  const scoredItems: MatchResult[] = [];

  for (const item of catalogue) {
    const searchText = createSearchableText(
      item.shortName,
      item.description,
      item.categoryName
    );

    // Keyword score
    const { score: keywordScore, matchedKeywords } = calculateKeywordScore(
      intakeTokens,
      item.tags,
      searchText
    );

    // Fuzzy score (default 0 if not in Fuse results)
    const fuzzyScore = fuseScoreMap.get(item.position) ?? 0;

    // Category boost
    const categoryBoost = difficultAccess && item.category === SCAFFOLDING_CATEGORY;
    const categoryBoostScore = categoryBoost ? 100 : 0;

    // Combined score
    const totalScore =
      (W_KEYWORD * keywordScore) +
      (W_FUZZY * fuzzyScore) +
      (W_CATEGORY * categoryBoostScore);

    // Only include items with some relevance
    if (totalScore > 0) {
      scoredItems.push({
        position: item.position,
        shortName: item.shortName,
        unit: item.unit,
        score: Math.round(totalScore * 10) / 10, // Round to 1 decimal
        why: generateWhy(matchedKeywords, fuzzyScore, categoryBoost),
        matchedKeywords,
        fuzzyScore,
        categoryBoost,
      });
    }
  }

  // Step 3: De-duplicate by position (keep highest score)
  const deduped = new Map<string, MatchResult>();
  for (const item of scoredItems) {
    const existing = deduped.get(item.position);
    if (!existing || item.score > existing.score) {
      deduped.set(item.position, item);
    }
  }

  // Step 4: Sort by score descending
  const sorted = Array.from(deduped.values()).sort((a, b) => b.score - a.score);

  // Step 5: Return top N
  return sorted.slice(0, topN);
}

/**
 * Generates a human-readable "why" explanation for the match
 */
function generateWhy(
  matchedKeywords: string[],
  fuzzyScore: number,
  categoryBoost: boolean
): string {
  const reasons: string[] = [];

  if (matchedKeywords.length > 0) {
    const keywords = matchedKeywords.slice(0, 3).join(', ');
    const more = matchedKeywords.length > 3 ? ` +${matchedKeywords.length - 3} more` : '';
    reasons.push(`Matched: ${keywords}${more}`);
  }

  if (fuzzyScore > 50) {
    reasons.push('High text similarity');
  } else if (fuzzyScore > 20) {
    reasons.push('Partial text match');
  }

  if (categoryBoost) {
    reasons.push('Boosted: difficult access');
  }

  return reasons.join(' | ') || 'Weak match';
}
