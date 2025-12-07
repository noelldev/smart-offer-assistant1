import { DE_EN_SYNONYMS, STOP_WORDS } from './synonyms';

/**
 * Normalizes text for matching:
 * - Converts to lowercase
 * - Removes punctuation and diacritics
 * - Strips extra whitespace
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    // Remove diacritics (ä→a, ö→o, ü→u, ß→ss)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Handle German ß specifically
    .replace(/ß/g, 'ss')
    // Remove punctuation
    .replace(/[^\w\s]/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts meaningful tokens from text:
 * - Normalizes the text
 * - Splits into words
 * - Filters out stop words
 * - Expands German terms to English synonyms
 */
export function extractTokens(text: string): string[] {
  const normalized = normalizeText(text);
  const words = normalized.split(' ');

  const tokens = new Set<string>();

  for (const word of words) {
    // Skip empty strings and stop words
    if (!word || word.length < 2 || STOP_WORDS.has(word)) {
      continue;
    }

    // Add the original word
    tokens.add(word);

    // Check for German synonyms and add English equivalents
    const synonyms = DE_EN_SYNONYMS[word];
    if (synonyms) {
      for (const syn of synonyms) {
        // Add each word from multi-word synonyms
        for (const synWord of syn.split(' ')) {
          if (synWord.length >= 2) {
            tokens.add(synWord);
          }
        }
      }
    }
  }

  return Array.from(tokens);
}

/**
 * Creates a searchable text from catalogue item fields
 */
export function createSearchableText(
  shortName: string,
  description: string,
  categoryName: string
): string {
  return normalizeText(`${shortName} ${description} ${categoryName}`);
}
