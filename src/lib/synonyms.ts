/**
 * German to English synonym mappings for common construction/trade terms.
 * Used to improve matching when intake contains German terms.
 */
export const DE_EN_SYNONYMS: Record<string, string[]> = {
  // Water/Plumbing
  wasser: ['water', 'pipe', 'plumbing'],
  wasserschaden: ['water damage', 'leak', 'flooding'],
  rohr: ['pipe', 'tube'],
  leitung: ['pipe', 'line', 'cable'],
  wasserhahn: ['faucet', 'tap'],
  toilette: ['toilet', 'wc', 'bathroom'],
  bad: ['bathroom', 'bath'],
  sanitär: ['plumbing', 'sanitary'],

  // Roof
  dach: ['roof', 'roofing'],
  dachreparatur: ['roof repair'],
  dachrinne: ['gutter', 'gutters'],
  ziegel: ['tile', 'tiles', 'shingle'],
  undicht: ['leak', 'leaking', 'leaky'],

  // Painting
  streichen: ['paint', 'painting'],
  farbe: ['paint', 'color'],
  anstrich: ['painting', 'coat'],
  tapete: ['wallpaper'],
  wand: ['wall'],
  decke: ['ceiling'],

  // Electrical
  strom: ['electricity', 'electrical', 'power'],
  steckdose: ['outlet', 'socket', 'power outlet'],
  schalter: ['switch', 'light switch'],
  lampe: ['lamp', 'light'],
  kabel: ['cable', 'wire'],

  // Construction/General
  reparatur: ['repair', 'fix'],
  reparieren: ['repair', 'fix'],
  baustelle: ['construction site', 'site'],
  gerüst: ['scaffolding', 'scaffold'],
  zugang: ['access'],
  schwer: ['difficult', 'hard', 'heavy'],
  beschädigt: ['damaged', 'broken'],
  schaden: ['damage'],
  erneuern: ['renew', 'replace', 'renovation'],
  austauschen: ['replace', 'exchange'],
  installieren: ['install', 'installation'],
  einbauen: ['install', 'fit'],

  // Earthworks
  erde: ['earth', 'soil', 'ground'],
  graben: ['dig', 'excavate', 'trench'],
  aushub: ['excavation'],
  bagger: ['excavator', 'digger'],

  // Materials
  holz: ['wood', 'timber'],
  beton: ['concrete'],
  putz: ['plaster', 'render'],
  fliese: ['tile'],
  dämmung: ['insulation'],
};

/**
 * Common stop words to filter out from search tokens
 */
export const STOP_WORDS = new Set([
  // English
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'we', 'you', 'i', 'he', 'she', 'it', 'they', 'them', 'their', 'our',
  'my', 'your', 'his', 'her', 'its', 'this', 'that', 'these', 'those',
  'there', 'here', 'where', 'when', 'what', 'which', 'who', 'whom',
  'some', 'any', 'no', 'not', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'under', 'again', 'further',
  'then', 'once', 'also', 'just', 'only', 'very', 'too', 'so',
  // German
  'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'in', 'auf',
  'an', 'zu', 'für', 'von', 'mit', 'bei', 'nach', 'aus', 'um', 'über',
  'ist', 'sind', 'war', 'waren', 'sein', 'haben', 'hat', 'hatte',
  'wir', 'sie', 'er', 'es', 'ich', 'du', 'ihr', 'uns', 'euch',
  'mein', 'dein', 'sein', 'ihr', 'unser', 'euer',
  'dieser', 'diese', 'dieses', 'jener', 'jene', 'jenes',
  'hier', 'dort', 'wo', 'wann', 'was', 'wer', 'wie', 'warum',
  'nicht', 'kein', 'keine', 'keiner', 'alle', 'jeder', 'jede', 'jedes',
  'noch', 'schon', 'auch', 'nur', 'sehr', 'so', 'dann', 'wenn',
]);
