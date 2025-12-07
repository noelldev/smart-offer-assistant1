# Production Proposal: Smart Offer Assistant

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ IntakeForm  │───▶│  Matcher    │───▶│   ResultsTable      │  │
│  │ (React)     │    │  (lib)      │    │   (React)           │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Future)                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Next.js API Routes / Edge Functions         │    │
│  │  POST /api/match    { intake } → { results[] }          │    │
│  │  GET  /api/catalogue                                     │    │
│  │  POST /api/offers   { intake, selected[] } → { offer }  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  PostgreSQL  │  │    Redis     │  │   Object Storage     │   │
│  │  - Catalogue │  │  - Sessions  │  │   - Generated PDFs   │   │
│  │  - Customers │  │  - Cache     │  │   - Export files     │   │
│  │  - Offers    │  │              │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Current MVP (Client-Side Only)
- Single-page React app
- Matching runs entirely in browser
- Catalogue loaded from static JSON
- No persistence

### Production Path
1. Move matching to API route (keeps client lightweight)
2. Add PostgreSQL for catalogue + customer + offer storage
3. Add Redis for session management and result caching
4. Add object storage for generated documents

---

## Matching Evolution

### Phase 1: Synonyms (Current)
- Manual DE→EN keyword mappings
- Fuse.js fuzzy matching
- Static category boost rules

**Pros**: Explainable, fast, no external dependencies
**Cons**: Limited coverage, maintenance burden

### Phase 2: Enhanced Synonyms
- Expand synonym dictionary from usage logs
- Add industry-specific term mappings
- Implement stemming (repair→repair, repairing→repair)

### Phase 3: Embeddings (Future)
```
intake_text → embedding_model → vector
catalogue_item → embedding_model → vector
similarity = cosine(intake_vector, item_vector)
```

**Approach**: Use sentence transformers (e.g., multilingual-e5-small) to generate embeddings. Store item embeddings in PostgreSQL with pgvector extension.

**Explainability Preserved**:
- Keep keyword/synonym matching as primary signal
- Use embeddings as secondary signal with lower weight
- Always show "why" based on keyword matches
- Embeddings boost score but don't replace explanation

```
score = (0.3 × keyword) + (0.2 × fuzzy) + (0.3 × embedding_sim) + (0.2 × boost)
```

---

## Persistence & Exports

### Data Model

```sql
-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers (saved matching sessions)
CREATE TABLE offers (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  description TEXT NOT NULL,
  difficult_access BOOLEAN DEFAULT FALSE,
  selected_positions JSONB,  -- [{position, quantity, notes}]
  total_estimate DECIMAL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalogue (version-controlled)
CREATE TABLE catalogue_versions (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Export Options

| Format | Library | Use Case |
|--------|---------|----------|
| **PDF** | `@react-pdf/renderer` | Client-side generation, simple templates |
| **PDF (complex)** | `puppeteer` + HTML template | Server-side, complex layouts, headers/footers |
| **DOCX** | `docx` (npm) | Editable quotes, client-side generation |
| **XLSX** | `exceljs` | Data export, line-item details |

**Recommendation**: Start with client-side PDF generation using `@react-pdf/renderer`. It's lightweight, works without server infrastructure, and handles typical quote layouts well.

---

## Ops / Run

### Logging
- **Structured logs**: JSON format with request ID, user ID, action
- **Key events**: Match requests, export generation, errors
- **Tool**: Pino (fast JSON logger) → stdout → cloud log aggregator

### Metrics
| Metric | Type | Purpose |
|--------|------|---------|
| `match_requests_total` | Counter | Traffic volume |
| `match_duration_seconds` | Histogram | Algorithm performance |
| `results_returned` | Histogram | Quality signal (0 results = bad) |
| `export_generated` | Counter by format | Feature usage |

**Tool**: Prometheus-compatible metrics endpoint, scrape with Grafana Cloud or self-hosted.

### Error Handling
- Client errors: Toast notifications + form validation
- API errors: Structured error responses with codes
- Unhandled: Global error boundary, report to Sentry

### Privacy
- **PII fields**: name, email, phone, address
- **At rest**: Encrypt database (standard cloud DB encryption)
- **In transit**: HTTPS only
- **Retention**: Customer data retained until deletion request
- **Audit**: Log access to PII fields

### SLIs / SLOs

| SLI | Target SLO |
|-----|------------|
| Availability (HTTP 2xx) | 99.5% monthly |
| Match latency (p95) | < 500ms |
| Export generation (p95) | < 3s |
| Error rate | < 1% of requests |

---

## Risks & Trade-offs

### Simplified Now

| Area | Simplification | Hardening Path |
|------|----------------|----------------|
| **Auth** | None | Add NextAuth.js with company SSO |
| **Multi-tenancy** | Single catalogue | Add org_id to all tables |
| **Catalogue sync** | Static JSON | Webhook from master system, versioned imports |
| **Offline** | Requires internet | Service worker + IndexedDB for offline matching |
| **Search accuracy** | Basic synonyms | Feedback loop to improve mappings |

### Key Risks

1. **Synonym coverage**: Manual mappings won't cover all terms
   - *Mitigation*: Log unmatched queries, review weekly, expand dictionary

2. **Catalogue staleness**: Static JSON gets outdated
   - *Mitigation*: Automated nightly fetch from master system

3. **Performance at scale**: Full catalogue scan for each match
   - *Mitigation*: Pre-index with Fuse.js, move to server-side with caching

4. **Browser compatibility**: Client-side matching may be slow on old devices
   - *Mitigation*: Move matching to API, keep client as pure UI

---

## Summary

The MVP demonstrates the core matching loop with a clean, explainable algorithm. Production hardening focuses on:

1. **Move matching server-side** for performance and caching
2. **Add persistence** for customers, offers, and catalogue versioning
3. **Evolve matching** from synonyms → embeddings while keeping explainability
4. **Standard ops** with structured logging, metrics, and error tracking

No LLMs in the ranking path—the algorithm remains deterministic and auditable.
