# Smart Offer Assistant

A minimal prototype that converts client intake into a ranked list of recommended services from a trade catalogue. Built with Next.js, TypeScript, and Tailwind CSS.

## Quick Start (< 5 minutes)

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - the form is pre-filled with an example, click **Run Matching** to see results immediately.

## Scoring Formula

The matching algorithm uses a weighted scoring formula:

```
score = (0.4 × keyword_score) + (0.4 × fuzzy_score) + (0.2 × category_boost)
```

| Component | Weight | Description |
|-----------|--------|-------------|
| `keyword_score` | 40% | Percentage of intake tokens found in item's shortName/description/tags |
| `fuzzy_score` | 40% | Fuse.js proximity score (0-100, higher = better match) |
| `category_boost` | 20% | 100 if category matches boost condition (scaffolding + difficult access), else 0 |

### Algorithm Steps

1. **Normalize** - lowercase, strip punctuation/diacritics
2. **Tokenize** - extract keywords, filter stop words, expand DE→EN synonyms
3. **Score** - calculate keyword overlap + fuzzy proximity + category boost
4. **Rank** - de-duplicate by position, sort descending, return top 15

## Synonym List / Normalization

German-English synonyms are mapped in `src/lib/synonyms.ts`:

- **Plumbing**: wasser→water, rohr→pipe, wasserhahn→faucet
- **Roofing**: dach→roof, dachrinne→gutter, undicht→leak
- **Painting**: streichen→paint, wand→wall, decke→ceiling
- **Electrical**: strom→electricity, steckdose→outlet
- **General**: reparatur→repair, gerüst→scaffolding, beschädigt→damaged

Text normalization:
- Converts ä→a, ö→o, ü→u, ß→ss
- Removes punctuation
- Filters common stop words (the, a, der, die, das, etc.)

## UI Choices

### State Management
**Choice**: Simple React `useState` hooks

**Why**: For this MVP scope, client-side state is sufficient. No server state to sync, no complex caching needed. TanStack Query would add unnecessary complexity for a demo that runs matching synchronously.

### Validation
**Choice**: React Hook Form + Zod

**Why**: Type-safe validation with excellent TypeScript integration. Zod schemas are declarative and reusable. React Hook Form provides optimized re-renders and easy integration.

### Styling
**Choice**: Tailwind CSS

**Why**: Rapid prototyping with utility classes. Consistent spacing/typography via design system. No context switching between CSS files. Easy responsive design with breakpoint prefixes.

### Component Structure
```
src/
├── components/
│   ├── IntakeForm.tsx    # Form with validation
│   ├── ResultsTable.tsx  # Results display with filter/sort
│   └── ResultRow.tsx     # Individual result with expandable details
├── lib/
│   ├── matcher.ts        # Main matching algorithm
│   ├── normalizer.ts     # Text normalization utilities
│   ├── synonyms.ts       # DE→EN mappings
│   └── validation.ts     # Zod schemas
└── types/
    └── index.ts          # TypeScript interfaces
```

## Sample Data

- `sample/catalogue.json` - 7 trades, 16 positions (demo subset)
- `sample/intake.json` - Example customer intake for testing

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Search**: Fuse.js (fuzzy matching)
