# Zuma Branch Super App

A mobile-first Progressive Web Application (PWA) for Zuma Indonesia retail store management and RO (Replenishment Orders) processing.

[![Deploy on Vercel](https://img.shields.io/badge/Vercel-Live-success?style=flat&logo=vercel)](https://zuma-ro-pwa.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)

## Overview

Zuma Branch Super App is a comprehensive mobile-first PWA designed for Zuma Indonesia's retail store management. It streamlines the replenishment order (RO) process, provides real-time inventory insights, and offers sales analytics to help store managers make data-driven decisions.

**Live URL:** [https://zuma-ro-pwa.vercel.app](https://zuma-ro-pwa.vercel.app)

## Features

### Navigation (5-Tab System)
| Tab | Purpose |
|-----|---------|
| **Home** | Sales analytics dashboard with 7 breakdown tables |
| **SKU** | Product catalog and inventory lookup |
| **Action** | Quick actions center (future) |
| **RO** | Replenishment Orders management (3 sub-tabs) |
| **Settings** | System status and configuration |

### RO Page (3 Sub-tabs)

#### 1. Dashboard (Read-Only)
- Stats cards: Total RO, Queued, Total Boxes, Total Pairs
- RO list table with status badges
- Real-time aggregations

#### 2. Request Form (Create RO)
- Store selection dropdown (dynamic from database)
- AUTO button for recommendations
- Manual article selection with search/filter
- Per-warehouse quantity controls (DDD/LJBB +/-)
- Stock availability validation
- Auto-generated RO ID (format: `RO-YYMM-XXXX`)

#### 3. RO Process (Track & Update)
- 8-stage visual timeline
- Status progression
- DNPB number input (Delivery Note Pengiriman Barang)
- Article breakdown with allocations

### RO Status Flow
```
QUEUE → APPROVED → PICKING → PICK_VERIFIED → DNPB_PROCESS → READY_TO_SHIP → IN_DELIVERY → ARRIVED → COMPLETED
  │
  └─► CANCELLED (from any status except COMPLETED)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Icons | Lucide React |
| Charts | Recharts |
| Deployment | Vercel |

### Zuma Branding
- **Primary Dark:** `#0D3B2E`
- **Accent Green:** `#00D084`

## Database Architecture

**Schema:** `branch_super_app_clawdbot`

### Core Tables

#### `ro_process` - Active RO Allocations
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| ro_id | VARCHAR(50) | Auto-generated: RO-YYMM-XXXX |
| article_code | VARCHAR(50) | Product code |
| article_name | VARCHAR(255) | Product name |
| boxes_requested | INTEGER | Total boxes requested |
| boxes_allocated_ddd | INTEGER | Boxes from DDD warehouse |
| boxes_allocated_ljbb | INTEGER | Boxes from LJBB warehouse |
| boxes_allocated_mbb | INTEGER | Boxes from MBB warehouse |
| boxes_allocated_ubb | INTEGER | Boxes from UBB warehouse |
| status | VARCHAR(50) | Current status (default: QUEUE) |
| store_name | VARCHAR(255) | Destination store |
| notes | TEXT | Optional notes |
| dnpb_number | VARCHAR(100) | Delivery Note number |
| dnpb_match | BOOLEAN | TRUE if matched with transaction |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

#### `ro_recommendations` - Auto-Generated Suggestions
| Column | Type | Description |
|--------|------|-------------|
| Store Name | TEXT | Target store |
| Article Mix | TEXT | Article code |
| Tier | VARCHAR(50) | Priority tier |
| Recommendation (box) | INTEGER | Suggested quantity |
| ASSRT STATUS | TEXT | FULL/BROKEN |

#### Stock Tables
- `supabase_stockawalDDD` - Initial DDD stock
- `supabase_stockawalLJBB` - Initial LJBB stock
- `supabase_stockawalMBB` - Initial MBB stock

#### Transaction Tables
- `supabase_transkasiDDD` - DDD transactions (has DNPB column)
- `supabase_transkasiLJBB` - LJBB transactions (has DNPB column)
- `supabase_transkasiMBB` - MBB transactions (has DNPB column)

### VIEW: `master_mutasi_whs`

Calculated view that combines stock and transactions:

```
Stock Akhir = Stock Awal + Transaksi IN - Transaksi OUT - RO Allocations
```

**Key Logic:**
- RO allocations only counted when `dnpb_match = FALSE`
- When `dnpb_match = TRUE`, stock already deducted via transaction tables (prevents double-counting)
- Each entity row (DDD/LJBB/MBB) only shows its own stock

## DNPB Matching Logic

DNPB (Delivery Note Pengiriman Barang) prevents double-counting of stock movements.

**Flow:**
1. User inputs DNPB number in RO Process (e.g., `DNPB/DDD/WHS/2026/I/001`)
2. System checks if DNPB exists in transaction tables
3. If match found → `dnpb_match = TRUE` → Exclude from ro_totals calculation
4. If no match → `dnpb_match = FALSE` → Include in stock calculation

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stores` | GET | List stores from recommendations |
| `/api/articles` | GET | Search articles with stock |
| `/api/ro/recommendations` | GET | Get store-specific recommendations |
| `/api/ro/submit` | POST | Create new RO |
| `/api/ro/process` | GET | List submitted ROs |

### Example: Submit RO
```bash
curl -X POST "/api/ro/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "Zuma Matos",
    "articles": [{
      "code": "B2TS01",
      "name": "BOYS TOY STORY 1",
      "boxes_ddd": 2,
      "boxes_ljbb": 1,
      "boxes_mbb": 0,
      "boxes_ubb": 0
    }],
    "notes": "Weekly order"
  }'
```

## Development

### Prerequisites
- Node.js 20+
- npm
- Supabase account

### Setup
```bash
git clone https://github.com/harvey-wayan-ai/zuma-branch-superapp.git
cd zuma-branch-superapp
npm install
cp .env.example .env.local
npm run dev
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint check
```

### Migrations
Run in order:
1. `001_create_ro_stockwhs.sql`
2. `002_create_ro_process.sql`
3. `003_create_ro_whs_readystock.sql`
4. `004_create_ro_recommendations.sql`
5. `005_add_ro_id_auto_generation.sql`
6. `006_create_tables_in_correct_schema.sql`
7. `007_add_dnpb_columns.sql`
8. `008_update_master_mutasi_whs_dnpb_logic.sql`

## File Structure
```
app/
├── api/
│   ├── articles/route.ts
│   ├── stores/route.ts
│   └── ro/
│       ├── recommendations/route.ts
│       ├── submit/route.ts
│       └── process/route.ts
├── globals.css
├── layout.tsx
└── page.tsx

components/
├── MainLayout.tsx
├── BottomNavigation.tsx
├── ROPage.tsx
├── RequestForm.tsx
├── ROProcess.tsx
├── SettingsPage.tsx
└── ui/

lib/
├── supabase.ts
└── utils.ts

docs/
├── ARCHITECTURE.md
├── DNPB_MATCHING_LOGIC.md
├── RO_REQUEST_ARCHITECTURE.md
└── TROUBLESHOOTING.md

supabase/
└── migrations/
```

## Business Rules

1. **RO ID Format:** `RO-YYMM-XXXX` (auto-generated, unique per month)
2. **1 Box = 12 Pairs** (size assortment)
3. **Warehouse Priority:** DDD → LJBB (MBB/UBB display only, not for retail)
4. **Stock Validation:** Cannot request more than available
5. **DNPB Matching:** Prevents double-counting when delivery note exists in transactions

## Roadmap

- [x] 5-tab navigation
- [x] RO Dashboard with stats
- [x] RO Request Form with per-warehouse allocation
- [x] RO Process with 8-stage timeline
- [x] DNPB matching logic
- [x] Stock deduction on RO submit
- [x] Sales analytics dashboard
- [x] Supabase integration
- [x] Vercel deployment
- [x] Toast notifications (sonner)
- [x] Confirmation dialogs for destructive actions
- [x] Unsaved changes warnings
- [ ] SKU product catalog
- [ ] Push notifications
- [ ] Offline sync
- [ ] Authentication

---

**Repository:** [github.com/harvey-wayan-ai/zuma-branch-superapp](https://github.com/harvey-wayan-ai/zuma-branch-superapp)

Built for Zuma Indonesia
