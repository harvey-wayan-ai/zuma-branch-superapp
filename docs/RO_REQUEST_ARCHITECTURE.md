# RO Request Tab - Logic & Architecture Document

## Overview
The RO Request Form needs to support **dual data sources** for article selection:
1. **Auto-Generated Recommendations** - System-suggested articles based on store selection
2. **Manual Article Addition** - User-selected articles from catalog

Both sources display **unified warehouse stock levels** for easier management.

---

## User Flow

### 1. Store Selection
- User selects a store from dropdown
- **Trigger**: Auto-generate button becomes active
- System fetches recommendations for that store

### 2. Auto-Generated Request (Source 1)
**Purpose**: System recommends articles that need replenishment

**Logic**:
- Based on store's sales velocity, current stock, and reorder points
- Algorithm calculates: `Recommended Boxes = (Sales Velocity × Lead Time) - Current Stock`
- Only shows articles below reorder threshold

**UI Behavior**:
- Display as pre-filled list with suggested box quantities
- User can:
  - ✅ Accept all recommendations (one-click)
  - ✏️ Edit quantities per article
  - 🗑️ Remove specific articles
  - ➕ Add more articles manually (Source 2)

### 3. Manual Article Addition (Source 2)
**Purpose**: User wants to add articles not in auto-generated list

**Logic**:
- Opens article selector modal
- Search/filter through complete article catalog
- Select articles one by one
- Default quantity: 1 box (editable)

**UI Behavior**:
- "+ Add Article" button opens selector
- Selected articles append to the request list
- Can mix with auto-generated articles

---

## Data Architecture

### Table 1: `ro_recommendations` (Auto-Generated Source)
Stores system-generated RO suggestions per store.

```sql
-- Purpose: Pre-calculated recommendations for each store
-- Updated: Daily/hourly via scheduled job or trigger

create table ro_recommendations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id),
  article_code varchar(50) references articles(code),
  
  -- Recommendation Logic
  current_stock_store int,           -- Current stock at store
  current_stock_warehouse int,       -- Current stock at warehouse (from master)
  avg_weekly_sales decimal(10,2),    -- Average weekly sales velocity
  weeks_of_stock decimal(5,2),       -- Current weeks of stock remaining
  
  -- Recommendation
  suggested_boxes int,               -- Algorithm-recommended boxes
  priority varchar(20),              -- 'urgent' | 'normal' | 'low'
  reason text,                       -- Why recommended (e.g., "Low stock + high velocity")
  
  -- Metadata
  calculated_at timestamp default now(),
  valid_until timestamp,             -- Recommendation expiry
  
  -- Constraints
  unique(store_id, article_code)
);
```

**Key Columns**:
- `current_stock_warehouse` → References unified warehouse stock
- `suggested_boxes` → Pre-calculated recommendation
- `priority` → Visual indicator (red/yellow/green)

---

### Table 2: `articles` (Manual Addition Source)
Master catalog of all available articles.

```sql
-- Purpose: Complete product catalog for manual selection
-- Note: Stock column is a VIEW from warehouse master, not stored here

create table articles (
  code varchar(50) primary key,      -- Article code (e.g., M1AMV102)
  name varchar(255) not null,        -- Article name
  series varchar(100),               -- Product series (AIRMOVE, CLASSIC, etc.)
  gender varchar(20),                -- MEN | WOMEN | KIDS
  base_price decimal(10,2),          -- Base price per pair
  box_size int default 12,           -- Pairs per box (usually 12)
  
  -- Categorization
  category varchar(100),
  is_active boolean default true,
  
  -- Metadata
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

**Note**: No stock column here - stock is pulled dynamically from warehouse master via JOIN.

---

### Table 3: `warehouse_stock` (Master Stock Source)
**Single Source of Truth** for all warehouse inventory.

```sql
-- Purpose: Unified warehouse stock levels
-- Updated: Real-time or near real-time from inventory system

create table warehouse_stock (
  id uuid primary key default gen_random_uuid(),
  article_code varchar(50) references articles(code),
  warehouse_id uuid references warehouses(id),
  
  -- Stock Levels
  available_boxes int,               -- Available for allocation
  reserved_boxes int,                -- Reserved for pending orders
  total_boxes int,                   -- Total physical stock
  
  -- Location-specific
  location_code varchar(50),         -- DDD, LJBB, etc.
  
  -- Metadata
  last_updated timestamp default now(),
  
  -- Constraints
  unique(article_code, warehouse_id, location_code)
);
```

**Key Point**: Both `ro_recommendations` and `articles` reference this table for stock display.

---

## Unified Stock Display Logic

### Challenge
Both tables need to show warehouse stock, but:
- `ro_recommendations` has its own `current_stock_warehouse` column
- `articles` doesn't store stock (must query warehouse_stock)

### Solution: Database VIEW

```sql
-- Create a unified stock view for easy querying

create view article_stock_summary as
select 
  ws.article_code,
  sum(ws.available_boxes) as total_available_boxes,
  sum(ws.total_boxes) as total_physical_boxes,
  json_agg(
    json_build_object(
      'warehouse_id', ws.warehouse_id,
      'location', ws.location_code,
      'available', ws.available_boxes
    )
  ) as warehouse_breakdown
from warehouse_stock ws
group by ws.article_code;
```

### Application Logic

#### For Auto-Generated List (from `ro_recommendations`):
```typescript
// API Response Structure
interface RORecommendationItem {
  // From ro_recommendations table
  article_code: string;
  article_name: string;              // JOIN with articles
  suggested_boxes: number;
  current_stock_store: number;
  priority: 'urgent' | 'normal' | 'low';
  
  // From warehouse_stock (via JOIN or cached in ro_recommendations)
  warehouse_stock: {
    total_available: number;
    ddd_available: number;
    ljbb_available: number;
  };
  
  // Calculated
  max_orderable: number;             // min(suggested_boxes, warehouse_stock.total_available)
}
```

#### For Manual Addition (from `articles`):
```typescript
// API Response Structure
interface ArticleCatalogItem {
  // From articles table
  code: string;
  name: string;
  series: string;
  gender: string;
  
  // From warehouse_stock (real-time query)
  warehouse_stock: {
    total_available: number;
    ddd_available: number;
    ljbb_available: number;
  };
  
  // UI State
  selected: boolean;
  quantity: number;
}
```

---

## Frontend Component Architecture

### State Management
```typescript
interface RORequestState {
  // Selected Store
  selectedStore: Store | null;
  
  // Auto-Generated Items (Source 1)
  autoGeneratedItems: RORecommendationItem[];
  autoGeneratedAccepted: boolean;     // User accepted all suggestions
  
  // Manual Items (Source 2)
  manualItems: ArticleCatalogItem[];
  
  // Combined Request List (what gets submitted)
  requestItems: RequestItem[];        // Merged auto + manual
  
  // UI State
  isLoadingRecommendations: boolean;
  showArticleSelector: boolean;
}
```

### Component Flow

```
RequestForm
├── StoreSelector
│   └── onSelectStore → fetchRecommendations(storeId)
├── AutoGeneratedSection (conditional)
│   ├── RecommendationList
│   │   └── RecommendationCard (shows warehouse stock)
│   │       ├── Article Info
│   │       ├── Suggested Quantity (editable)
│   │       └── Warehouse Stock Badge
│   └── ActionButtons
│       ├── [Accept All] → add all to requestItems
│       └── [Clear All] → remove all auto-generated
├── ManualAdditionSection
│   ├── [+ Add Article] Button
│   │   └── opens ArticleSelectorModal
│   └── ArticleSelectorModal
│       ├── Search/Filter
│       └── ArticleList
│           └── ArticleCard (shows warehouse stock)
│               └── [+] Button → add to manualItems
└── RequestSummary
    ├── Combined Item List
    │   └── RequestItemCard (auto + manual mixed)
    ├── Totals (Articles, Boxes, Pairs)
    └── [Submit RO] Button
```

---

## API Endpoints Needed

### 1. Get Auto-Generated Recommendations
```http
GET /api/ro/recommendations?store_id={store_id}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "article_code": "M1AMV102",
      "article_name": "Men Airmove V2",
      "suggested_boxes": 5,
      "current_stock_store": 12,
      "priority": "urgent",
      "warehouse_stock": {
        "total_available": 45,
        "ddd_available": 30,
        "ljbb_available": 15
      }
    }
  ]
}
```

**SQL Logic**:
```sql
select 
  r.article_code,
  a.name as article_name,
  r.suggested_boxes,
  r.current_stock_store,
  r.priority,
  s.total_available_boxes as warehouse_total,
  -- Breakdown by location would need additional query or JSON
from ro_recommendations r
join articles a on r.article_code = a.code
left join article_stock_summary s on r.article_code = s.article_code
where r.store_id = $1
  and r.valid_until > now()
order by 
  case r.priority 
    when 'urgent' then 1 
    when 'normal' then 2 
    else 3 
  end,
  r.suggested_boxes desc;
```

---

### 2. Search Articles (Manual Addition)
```http
GET /api/articles/search?q={query}&gender={gender}&series={series}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "code": "W2ELSA01",
      "name": "Women Elsa Sandal",
      "series": "ELSA",
      "gender": "WOMEN",
      "warehouse_stock": {
        "total_available": 23,
        "ddd_available": 15,
        "ljbb_available": 8
      }
    }
  ]
}
```

**SQL Logic**:
```sql
select 
  a.code,
  a.name,
  a.series,
  a.gender,
  s.total_available_boxes as warehouse_total
from articles a
left join article_stock_summary s on a.code = s.article_code
where a.is_active = true
  and (
    a.code ilike $1 
    or a.name ilike $1
    or a.series ilike $1
  )
  and ($2::varchar is null or a.gender = $2)
  and ($3::varchar is null or a.series = $3)
order by a.code
limit 50;
```

---

### 3. Submit RO Request
```http
POST /api/ro/submit
```

**Request Body**:
```json
{
  "store_id": "uuid",
  "delivery_date": "2026-02-05",
  "items": [
    {
      "article_code": "M1AMV102",
      "boxes": 5,
      "source": "auto"  // or "manual"
    },
    {
      "article_code": "W2ELSA01",
      "boxes": 3,
      "source": "manual"
    }
  ],
  "notes": "Optional notes"
}
```

---

## Supabase Implementation Plan

### Phase 1: Core Tables
1. ✅ `articles` - Master catalog (likely exists)
2. ✅ `warehouse_stock` - Master stock (likely exists)
3. ⬜ `ro_recommendations` - NEW: Auto-generated suggestions
4. ⬜ `article_stock_summary` VIEW - Unified stock query

### Phase 2: RO System Tables
5. ⬜ `ro_sessions` - RO headers (may exist)
6. ⬜ `ro_items` - RO line items (may exist)
7. ⬜ `stores` - Store master (likely exists)

### Phase 3: Business Logic
8. ⬜ Function: `generate_ro_recommendations(store_id)`
9. ⬜ Scheduled Job: Daily refresh of recommendations
10. ⬜ Trigger: Update recommendations on stock change

### Phase 4: API & Frontend
11. ⬜ API Routes for recommendations and article search
12. ⬜ Frontend components for dual-source selection

---

## Key Design Decisions

### 1. Stock Display Strategy
**✅ DECIDED**: Pull from Google Sheets regularly
- Algorithm is configured in Google Sheets formula
- Supabase pulls this table from GSheet regularly (sync job)
- No complex calculation needed in Supabase

**Stock Entity Column**: `warehouse_stock` table has `entity` column with values:
- `DDD` - DDD warehouse location
- `LJBB` - LJBB warehouse location
- Show both in UI with breakdown

### 2. Handling Stock Conflicts
**Scenario**: User selects 5 boxes, but warehouse only has 3 available

**Solution**:
- Show real-time stock badge (green/yellow/red)
- Validate on submit: "Only 3 boxes available for M1AMV102"
- Auto-adjust: "Would you like to order 3 instead?"

### 3. Auto-Generated vs Manual Mix
**Rule**: Both sources feed into the same `requestItems` array
- Auto-generated items can be edited/removed
- Manual items can be added even if auto-generated exists
- No duplicates: If manual adds an article already in auto-list, merge them

---

## Open Questions for You

1. **Recommendation Algorithm**: What's the exact formula for calculating `suggested_boxes`?
   - Current: `(Sales Velocity × Lead Time) - Current Stock`
   - Any minimum/maximum constraints?
   - Seasonal adjustments?

2. **Stock Source**: Which warehouse locations should be included?
   - DDD only?
   - LJBB only?
   - Both combined?
   - User-selectable per article?

3. **Recommendation Refresh**: How often should auto-generated list update?
   - Real-time (on every store selection)?
   - Hourly batch job?
   - Daily at specific time?

4. **Priority Levels**: What defines "urgent" vs "normal" vs "low"?
   - Weeks of stock remaining?
   - Sales velocity?
   - Store-specific rules?

5. **Existing Tables**: Which tables already exist in your Supabase?
   - I saw `ro_items`, `ro_sessions`, `stores`, `articles` - are these populated?
   - Do you have `warehouse_stock` or similar?

---

## Next Steps

1. **Confirm existing schema** - Check what tables already exist
2. **Create missing tables** - `ro_recommendations`, views
3. **Implement recommendation algorithm** - SQL function or application logic
4. **Build API endpoints** - For recommendations and article search
5. **Update frontend** - Integrate dual-source selection

Let me know your answers to the open questions and I'll help you implement the Supabase schema!
