// Service Catalogue Types
export interface Position {
  position_number: string;
  short_name_de: string;
  short_name_en: string;
  unit: string;
  description_de: string;
  description_en: string;
  hero: boolean;
}

export interface Trade {
  code: string;
  name_de: string;
  name_en: string;
  positions: Position[];
}

export interface Catalogue {
  trades: Trade[];
}

// Flattened catalogue item for matching
export interface CatalogueItem {
  position: string;
  shortName: string;
  unit: string;
  description: string;
  category: string;
  categoryName: string;
  tags: string[];
  hero: boolean;
}

// Customer Intake Types
export interface CustomerIntake {
  customer: {
    name: string;
    company?: string;
    phone: string;
    email: string;
    address: string;
  };
  description: string;
  site: {
    difficultAccess: boolean;
  };
}

// Match Result Types
export interface MatchResult {
  position: string;
  shortName: string;
  unit: string;
  score: number;
  why: string;
  matchedKeywords: string[];
  fuzzyScore: number;
  categoryBoost: boolean;
}

// Form State
export interface IntakeFormData {
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  difficultAccess: boolean;
}
