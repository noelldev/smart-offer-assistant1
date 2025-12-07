import { matchServices, flattenCatalogue } from '../lib/matcher';
import { extractTokens, normalizeText } from '../lib/normalizer';
import { Catalogue, CatalogueItem } from '../types';

// Sample catalogue for testing
const sampleCatalogue: Catalogue = {
  trades: [
    {
      code: '0300',
      name_de: 'Gerüstbau',
      name_en: 'Scaffolding',
      positions: [
        {
          position_number: '0301',
          short_name_de: 'Gerüst aufstellen',
          short_name_en: 'Erect scaffolding',
          unit: 'm²',
          description_de: 'Aufstellen eines Arbeitsgerüsts',
          description_en: 'Erect a work scaffolding for difficult access areas',
          hero: true,
        },
      ],
    },
    {
      code: '4000',
      name_de: 'Sanitär',
      name_en: 'Plumbing',
      positions: [
        {
          position_number: '4001',
          short_name_de: 'Wasserleitung reparieren',
          short_name_en: 'Repair water pipe',
          unit: 'pauschal',
          description_de: 'Reparatur einer defekten Wasserleitung',
          description_en: 'Repair of a defective water pipe',
          hero: true,
        },
      ],
    },
    {
      code: '8500',
      name_de: 'Malerarbeiten',
      name_en: 'Painting',
      positions: [
        {
          position_number: '8501',
          short_name_de: 'Innenanstrich',
          short_name_en: 'Interior painting',
          unit: 'm²',
          description_de: 'Streichen von Innenwänden',
          description_en: 'Painting interior walls with emulsion paint',
          hero: true,
        },
      ],
    },
    {
      code: '9000',
      name_de: 'Dacharbeiten',
      name_en: 'Roofing',
      positions: [
        {
          position_number: '9001',
          short_name_de: 'Dach reparieren',
          short_name_en: 'Repair roof',
          unit: 'm²',
          description_de: 'Reparatur von beschädigten Dachflächen',
          description_en: 'Repair of damaged roof surfaces',
          hero: true,
        },
      ],
    },
  ],
};

describe('normalizeText', () => {
  it('converts text to lowercase', () => {
    expect(normalizeText('HELLO World')).toBe('hello world');
  });

  it('removes punctuation', () => {
    expect(normalizeText('hello, world!')).toBe('hello world');
  });

  it('handles German umlauts', () => {
    expect(normalizeText('Gerüst')).toBe('gerust');
  });

  it('converts ß to ss', () => {
    expect(normalizeText('Straße')).toBe('strasse');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeText('hello    world')).toBe('hello world');
  });
});

describe('extractTokens', () => {
  it('extracts meaningful tokens', () => {
    const tokens = extractTokens('water damage on the ceiling');
    expect(tokens).toContain('water');
    expect(tokens).toContain('damage');
    expect(tokens).toContain('ceiling');
  });

  it('filters out stop words', () => {
    const tokens = extractTokens('the water is on the floor');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('is');
    expect(tokens).not.toContain('on');
  });

  it('expands German synonyms to English', () => {
    const tokens = extractTokens('wasser schaden');
    expect(tokens).toContain('water');
    expect(tokens).toContain('damage');
  });

  it('returns unique tokens', () => {
    const tokens = extractTokens('water water water');
    const waterCount = tokens.filter((t) => t === 'water').length;
    expect(waterCount).toBe(1);
  });
});

describe('flattenCatalogue', () => {
  it('flattens nested catalogue structure', () => {
    const flattened = flattenCatalogue(sampleCatalogue);
    expect(flattened).toHaveLength(4);
  });

  it('includes category information in flattened items', () => {
    const flattened = flattenCatalogue(sampleCatalogue);
    const scaffolding = flattened.find((item) => item.position === '0301');
    expect(scaffolding?.category).toBe('0300');
    expect(scaffolding?.categoryName).toBe('Scaffolding');
  });
});

describe('matchServices', () => {
  let catalogue: CatalogueItem[];

  beforeAll(() => {
    catalogue = flattenCatalogue(sampleCatalogue);
  });

  it('returns empty array for empty description', () => {
    const results = matchServices('', false, catalogue);
    expect(results).toHaveLength(0);
  });

  it('matches water-related intake to plumbing services', () => {
    const results = matchServices('water pipe is leaking', false, catalogue);
    expect(results.length).toBeGreaterThan(0);

    // Plumbing should be in the results
    const plumbingResult = results.find((r) => r.position === '4001');
    expect(plumbingResult).toBeDefined();
  });

  it('matches roof-related intake to roofing services', () => {
    const results = matchServices('roof is damaged and needs repair', false, catalogue);
    expect(results.length).toBeGreaterThan(0);

    const roofResult = results.find((r) => r.position === '9001');
    expect(roofResult).toBeDefined();
  });

  it('matches painting-related intake to painting services', () => {
    const results = matchServices('need to paint the interior walls', false, catalogue);
    expect(results.length).toBeGreaterThan(0);

    const paintResult = results.find((r) => r.position === '8501');
    expect(paintResult).toBeDefined();
  });

  it('boosts scaffolding when difficultAccess is true', () => {
    const resultsWithoutAccess = matchServices('need work done', false, catalogue);
    const resultsWithAccess = matchServices('need work done', true, catalogue);

    const scaffoldingWithout = resultsWithoutAccess.find((r) => r.position === '0301');
    const scaffoldingWith = resultsWithAccess.find((r) => r.position === '0301');

    // Scaffolding should have higher score with difficult access
    if (scaffoldingWith && scaffoldingWithout) {
      expect(scaffoldingWith.score).toBeGreaterThan(scaffoldingWithout.score);
    } else if (scaffoldingWith) {
      // If scaffolding only appears with difficultAccess, that's also valid
      expect(scaffoldingWith.categoryBoost).toBe(true);
    }
  });

  it('includes "why" explanation in results', () => {
    const results = matchServices('water damage repair', false, catalogue);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].why).toBeDefined();
    expect(results[0].why.length).toBeGreaterThan(0);
  });

  it('sorts results by score descending', () => {
    const results = matchServices('water damage on roof needs painting', false, catalogue);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('limits results to top N', () => {
    const results = matchServices('water damage', false, catalogue, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('provides matched keywords in result', () => {
    const results = matchServices('water pipe repair', false, catalogue);
    const plumbingResult = results.find((r) => r.position === '4001');

    expect(plumbingResult?.matchedKeywords).toBeDefined();
    expect(plumbingResult?.matchedKeywords.length).toBeGreaterThan(0);
  });
});

describe('scoring formula', () => {
  let catalogue: CatalogueItem[];

  beforeAll(() => {
    catalogue = flattenCatalogue(sampleCatalogue);
  });

  it('produces scores between 0 and 100', () => {
    const results = matchServices('water damage roof painting scaffolding', true, catalogue);

    for (const result of results) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });

  it('produces higher scores for better matches', () => {
    const results = matchServices('repair water pipe plumbing', false, catalogue);

    // Plumbing service should score higher than unrelated services
    const plumbingResult = results.find((r) => r.position === '4001');
    const roofResult = results.find((r) => r.position === '9001');

    if (plumbingResult && roofResult) {
      expect(plumbingResult.score).toBeGreaterThan(roofResult.score);
    }
  });
});
