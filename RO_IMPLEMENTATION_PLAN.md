# RO (Request Order) Module Implementation Plan

## Overview
This document outlines the complete implementation plan for the RO (Request Order) module in the ZUMA RO PWA application. This module handles warehouse-to-store stock requests with real-time stock tracking.

---

## 1. Data Flow Architecture

### Database Schema Overview

```
┌─────────────────────┐     ┌─────────────────────┐
│   ro_recommendations │     │     ro_stockwhs     │
├─────────────────────┤     ├─────────────────────┤
│ - id (PK)           │     │ - id (PK)           │
│ - store_name        │     │ - article_code      │
│ - article_code      │     │ - article_name      │
│ - recommendation    │     │ - ddd_stock         │
│ - created_at        │     │ - ljbb_stock        │
└──────────┬──────────┘     │ - total_stock       │
           │                └──────────┬──────────┘
           │                           │
           │         ┌─────────────────┘
           │         │
           ▼         ▼
┌─────────────────────────────────────────┐
│       ro_whs_readystock (VIEW)          │
├─────────────────────────────────────────┤
│ - article_code                          │
│ - article_name                          │
│ - ddd_available                         │
│ - ljbb_available                        │
│ - total_available                       │
│                                         │
│ Formula: ro_stockwhs - SUM(ro_process)  │
│ (only for QUEUE, PROCESSING, DELIVERY,  │
│  COMPLETE statuses)                     │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│     ro_process      │
├─────────────────────┤
│ - id (PK)           │
│ - request_id        │
│ - article_code      │
│ - article_name      │
│ - quantity          │
│ - status            │
│ - store_name        │
│ - created_at        │
│ - updated_at        │
└─────────────────────┘
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ AUTO Button │  │ + ADD Button│  │   Article Cards         │  │
│  │ (Recommend) │  │ (Browse All)│  │   (Stock Display)       │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ GET /api/ro/    │  │ GET /api/ro/    │  │ GET /api/ro/    │  │
│  │ recommendations │  │ stock           │  │ stock/available │  │
│  │ ?store_name=xxx │  │ ?search=xxx     │  │ ?article_code=xx│  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ ro_recommendations│  │ ro_stockwhs   │  │ro_whs_readystock│  │
│  │                 │  │                 │  │    (VIEW)       │  │
│  │ Filter: rec > 0 │  │ Full stock list │  │ Real-time calc  │  │
│  │ Match: store    │  │ Searchable      │  │ DDD/LJBB/Total  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                           ▲                   ▲                  │
│                           │                   │                  │
│                    ┌──────┴───────────────────┘                  │
│                    │                                             │
│           ┌─────────────────┐                                    │
│           │   ro_process    │                                    │
│           │                 │                                    │
│           │ Status tracking │                                    │
│           │ QUEUE→COMPLETE  │                                    │
│           └─────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Table Relationships

1. **ro_recommendations** → Contains ML/algorithm recommendations for stores
   - Primary key: `id`
   - Links to stores via `store_name`
   - Links to articles via `article_code`
   - `recommendation` field indicates suggested quantity (>0 means recommended)

2. **ro_stockwhs** → Master stock table for warehouse inventory
   - Primary key: `id`
   - Unique by `article_code`
   - Contains: `ddd_stock`, `ljbb_stock`, `total_stock`
   - Source of truth for total warehouse stock

3. **ro_whs_readystock** → VIEW (not table) for available stock calculation
   - Virtual view combining `ro_stockwhs` and `ro_process`
   - Calculates: `available = total_stock - reserved_in_process`
   - Only subtracts processes with status: QUEUE, PROCESSING, DELIVERY, COMPLETE
   - Does NOT subtract: DNPB done, CANCELLED

4. **ro_process** → Tracks all outgoing stock requests/processes
   - Primary key: `id`
   - Foreign key: `request_id` (links to request header if exists)
   - Tracks: `article_code`, `quantity`, `status`, `store_name`
   - Status lifecycle: QUEUE → PROCESSING → DELIVERY → COMPLETE

---

## 2. AUTO Button Logic

### Purpose
The AUTO button allows users to quickly add all recommended articles for their store based on the ML recommendation engine.

### Filter Criteria

1. **Recommendation Filter**: Only show articles where `recommendation > 0`
2. **Store Match Filter**: Only show recommendations for the current user's store

### Display Information

Each card in the AUTO modal should display:
- Article Code
- Article Name
- **ASSRT STATUS** (from ro_recommendations.assrt_status)
- **BROKEN SIZE** (from ro_recommendations.broken_size)
- Current Available Stock (from ro_whs_readystock VIEW)
- Recommended Quantity

### SQL Query

```sql
-- AUTO Button: Fetch recommendations for a store
SELECT 
    r.id,
    r.store_name,
    r.article_code,
    r.article_name,
    r.recommendation,
    r.assrt_status,
    r.broken_size,
    s.ddd_available,
    s.ljbb_available,
    s.total_available
FROM ro_recommendations r
LEFT JOIN ro_whs_readystock s ON r.article_code = s.article_code
WHERE r.store_name = :store_name
    AND r.recommendation > 0
    AND s.total_available > 0  -- Only show if stock available
ORDER BY r.recommendation DESC, r.article_code;
```

### API Endpoint

```typescript
// GET /api/ro/recommendations?store_name={store_name}
// Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "store_name": "Store A",
      "article_code": "ART001",
      "article_name": "Product Name",
      "recommendation": 10,
      "assrt_status": "Active",
      "broken_size": "M,L",
      "ddd_available": 50,
      "ljbb_available": 30,
      "total_available": 80
    }
  ]
}
```

### Frontend Flow

1. User clicks "AUTO" button
2. Modal opens showing loading state
3. API fetches recommendations for user's store
4. Display cards with checkboxes for selection
5. User selects articles and clicks "Add Selected"
6. Selected articles added to request form with recommended quantities

---

## 3. + ADD Button Logic

### Purpose
The + ADD button allows users to manually browse and add any article from the warehouse stock, regardless of recommendations.

### Source Data
- **Table**: `ro_stockwhs`
- **Fields**: All articles with their stock information

### Features
- **Searchable**: By article name or article code
- **Real-time search**: Debounced input (300ms)
- **Pagination**: Load more as user scrolls (infinite scroll or pagination)

### SQL Query

```sql
-- + ADD Button: Search all stock articles
SELECT 
    s.id,
    s.article_code,
    s.article_name,
    s.ddd_stock,
    s.ljbb_stock,
    s.total_stock,
    r.ddd_available,
    r.ljbb_available,
    r.total_available
FROM ro_stockwhs s
LEFT JOIN ro_whs_readystock r ON s.article_code = r.article_code
WHERE (s.article_code ILIKE :search_term OR s.article_name ILIKE :search_term)
    AND r.total_available > 0  -- Only show available stock
ORDER BY s.article_code
LIMIT 50 OFFSET :offset;
```

### API Endpoint

```typescript
// GET /api/ro/stock?search={term}&page={page}&limit={limit}
// Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "article_code": "ART001",
      "article_name": "Product Name",
      "ddd_stock": 100,
      "ljbb_stock": 50,
      "total_stock": 150,
      "ddd_available": 50,
      "ljbb_available": 30,
      "total_available": 80
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 200,
    "has_more": true
  }
}
```

### Frontend Flow

1. User clicks "+ ADD" button
2. Modal opens with search input
3. User types in search box (debounced)
4. API returns matching articles
5. Display cards with "Add" button
6. User clicks "Add" on desired article
7. Article added to request form with default quantity 1

---

## 4. Stock Display Logic

### Overview
Every article card in the request form must display current available stock in real-time.

### Data Source
- **Source**: `ro_whs_readystock` VIEW
- **Key**: `article_code`
- **Fields**:
  - `ddd_available`: Available stock at DDD location
  - `ljbb_available`: Available stock at LJBB location
  - `total_available`: Total available across all locations

### Display Format

```
┌─────────────────────────────────────┐
│ Article Code: ART001                │
│ Article Name: Product Name          │
│                                     │
│ Available Stock:                    │
│   DDD: 50        LJBB: 30           │
│   Total: 80                         │
│                                     │
│ Request Qty: [____]  [Remove]       │
└─────────────────────────────────────┘
```

### Real-time Updates

- Stock should be fetched when article is added to form
- Optional: Refresh stock on interval or manual refresh
- Show warning if requested quantity > available stock

### SQL Query for Single Article

```sql
-- Get available stock for specific article
SELECT 
    article_code,
    article_name,
    ddd_available,
    ljbb_available,
    total_available
FROM ro_whs_readystock
WHERE article_code = :article_code;
```

### Validation Logic

```typescript
// Frontend validation
if (requestedQuantity > total_available) {
  showWarning("Requested quantity exceeds available stock");
  // Allow submission but flag for review
}
```

---

## 5. ro_whs_readystock VIEW Specification

### Critical Requirement
**MUST BE A VIEW, NOT A PHYSICAL TABLE**

This ensures real-time stock calculations without data duplication or synchronization issues.

### View Logic

**Formula**: 
```
available_stock = ro_stockwhs.total_stock - SUM(ro_process.quantity)
```

**Status Filter**:
- **SUBTRACT** (these statuses reserve stock):
  - `QUEUE`
  - `PROCESSING`
  - `DELIVERY`
  - `COMPLETE`
  
- **DO NOT SUBTRACT** (these don't reserve stock):
  - `DNPB done`
  - `CANCELLED`

### SQL CREATE VIEW Statement

```sql
CREATE OR REPLACE VIEW ro_whs_readystock AS
SELECT 
    s.article_code,
    s.article_name,
    s.ddd_stock - COALESCE(SUM(CASE 
        WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
        THEN p.quantity 
        ELSE 0 
    END), 0) AS ddd_available,
    s.ljbb_stock - COALESCE(SUM(CASE 
        WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
        THEN p.quantity 
        ELSE 0 
    END), 0) AS ljbb_available,
    s.total_stock - COALESCE(SUM(CASE 
        WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
        THEN p.quantity 
        ELSE 0 
    END), 0) AS total_available
FROM ro_stockwhs s
LEFT JOIN ro_process p ON s.article_code = p.article_code
GROUP BY s.article_code, s.article_name, s.ddd_stock, s.ljbb_stock, s.total_stock;
```

### Alternative: Separate by Location

If DDD and LJBB are separate processes:

```sql
CREATE OR REPLACE VIEW ro_whs_readystock AS
SELECT 
    s.article_code,
    s.article_name,
    GREATEST(0, s.ddd_stock - COALESCE(SUM(CASE 
        WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
        AND p.location = 'DDD'
        THEN p.quantity 
        ELSE 0 
    END), 0)) AS ddd_available,
    GREATEST(0, s.ljbb_stock - COALESCE(SUM(CASE 
        WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
        AND p.location = 'LJBB'
        THEN p.quantity 
        ELSE 0 
    END), 0)) AS ljbb_available,
    GREATEST(0, s.total_stock - COALESCE(SUM(CASE 
        WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
        THEN p.quantity 
        ELSE 0 
    END), 0)) AS total_available
FROM ro_stockwhs s
LEFT JOIN ro_process p ON s.article_code = p.article_code
GROUP BY s.article_code, s.article_name, s.ddd_stock, s.ljbb_stock, s.total_stock;
```

### Index Recommendations

For optimal VIEW performance:

```sql
-- Index on ro_process for faster aggregation
CREATE INDEX idx_ro_process_article_status ON ro_process(article_code, status);

-- Index on ro_stockwhs for faster joins
CREATE INDEX idx_ro_stockwhs_article ON ro_stockwhs(article_code);
```

---

## 6. Frontend Implementation Plan

### File: RequestForm.tsx

#### Changes Required

1. **Add Import Statements**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Zap, Trash2, AlertCircle } from 'lucide-react';
import { debounce } from 'lodash';
```

2. **Add State Management**
```typescript
interface RequestItem {
  id?: string;
  article_code: string;
  article_name: string;
  quantity: number;
  available_stock: {
    ddd: number;
    ljbb: number;
    total: number;
  };
}

interface Recommendation {
  id: number;
  article_code: string;
  article_name: string;
  recommendation: number;
  assrt_status: string;
  broken_size: string;
  available_stock: {
    ddd: number;
    ljbb: number;
    total: number;
  };
}

// State
const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
const [showAutoModal, setShowAutoModal] = useState(false);
const [showAddModal, setShowAddModal] = useState(false);
const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
const [stockSearchResults, setStockSearchResults] = useState<any[]>([]);
const [searchTerm, setSearchTerm] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

3. **Add API Integration**
```typescript
// Fetch recommendations
const fetchRecommendations = async () => {
  setIsLoading(true);
  try {
    const response = await fetch(`/api/ro/recommendations?store_name=${storeName}`);
    const data = await response.json();
    if (data.success) {
      setRecommendations(data.data);
    }
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
  } finally {
    setIsLoading(false);
  }
};

// Search stock
const searchStock = useCallback(
  debounce(async (term: string) => {
    if (!term) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ro/stock?search=${encodeURIComponent(term)}`);
      const data = await response.json();
      if (data.success) {
        setStockSearchResults(data.data);
      }
    } catch (error) {
      console.error('Failed to search stock:', error);
    } finally {
      setIsLoading(false);
    }
  }, 300),
  []
);
```

4. **Add Modal Components**
```typescript
// Auto Modal Component
const AutoModal = () => (
  <div className="modal">
    <div className="modal-content">
      <h2>Recommended Articles</h2>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="recommendation-list">
          {recommendations.map((rec) => (
            <div key={rec.id} className="recommendation-card">
              <input type="checkbox" id={`rec-${rec.id}`} />
              <label htmlFor={`rec-${rec.id}`}>
                <div className="article-code">{rec.article_code}</div>
                <div className="article-name">{rec.article_name}</div>
                <div className="assrt-status">ASSRT: {rec.assrt_status}</div>
                <div className="broken-size">Broken: {rec.broken_size}</div>
                <div className="stock-info">
                  Available: DDD {rec.available_stock.ddd} | 
                  LJBB {rec.available_stock.ljbb} | 
                  Total {rec.available_stock.total}
                </div>
                <div className="recommendation">Rec: {rec.recommendation}</div>
              </label>
            </div>
          ))}
        </div>
      )}
      <button onClick={addSelectedRecommendations}>Add Selected</button>
      <button onClick={() => setShowAutoModal(false)}>Cancel</button>
    </div>
  </div>
);

// Add Modal Component
const AddModal = () => (
  <div className="modal">
    <div className="modal-content">
      <h2>Add Articles</h2>
      <input
        type="text"
        placeholder="Search by code or name..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          searchStock(e.target.value);
        }}
      />
      {isLoading ? (
        <div>Searching...</div>
      ) : (
        <div className="stock-list">
          {stockSearchResults.map((stock) => (
            <div key={stock.id} className="stock-card">
              <div className="article-code">{stock.article_code}</div>
              <div className="article-name">{stock.article_name}</div>
              <div className="stock-info">
                Available: DDD {stock.ddd_available} | 
                LJBB {stock.ljbb_available} | 
                Total {stock.total_available}
              </div>
              <button onClick={() => addArticle(stock)}>Add</button>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setShowAddModal(false)}>Close</button>
    </div>
  </div>
);
```

5. **Update Main Form UI**
```typescript
return (
  <div className="request-form">
    {/* Header Buttons */}
    <div className="action-buttons">
      <button onClick={() => { setShowAutoModal(true); fetchRecommendations(); }}>
        <Zap /> AUTO
      </button>
      <button onClick={() => setShowAddModal(true)}>
        <Plus /> ADD
      </button>
    </div>

    {/* Request Items List */}
    <div className="request-items">
      {requestItems.map((item, index) => (
        <div key={index} className="request-item-card">
          <div className="article-info">
            <div className="article-code">{item.article_code}</div>
            <div className="article-name">{item.article_name}</div>
          </div>
          <div className="stock-display">
            <span>DDD: {item.available_stock.ddd}</span>
            <span>LJBB: {item.available_stock.ljbb}</span>
            <span>Total: {item.available_stock.total}</span>
          </div>
          <div className="quantity-input">
            <label>Qty:</label>
            <input
              type="number"
              min="1"
              max={item.available_stock.total}
              value={item.quantity}
              onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
            />
            {item.quantity > item.available_stock.total && (
              <AlertCircle className="warning-icon" />
            )}
          </div>
          <button onClick={() => removeItem(index)}>
            <Trash2 />
          </button>
        </div>
      ))}
    </div>

    {/* Modals */}
    {showAutoModal && <AutoModal />}
    {showAddModal && <AddModal />}

    {/* Submit Button */}
    <button onClick={submitRequest} disabled={requestItems.length === 0}>
      Submit Request
    </button>
  </div>
);
```

### API Endpoints to Create

#### 1. GET /api/ro/recommendations
```typescript
// File: app/api/ro/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeName = searchParams.get('store_name');

  if (!storeName) {
    return NextResponse.json(
      { success: false, error: 'Store name is required' },
      { status: 400 }
    );
  }

  try {
    const recommendations = await prisma.$queryRaw`
      SELECT 
        r.id,
        r.store_name,
        r.article_code,
        r.article_name,
        r.recommendation,
        r.assrt_status,
        r.broken_size,
        s.ddd_available,
        s.ljbb_available,
        s.total_available
      FROM ro_recommendations r
      LEFT JOIN ro_whs_readystock s ON r.article_code = s.article_code
      WHERE r.store_name = ${storeName}
        AND r.recommendation > 0
        AND s.total_available > 0
      ORDER BY r.recommendation DESC, r.article_code
    `;

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
```

#### 2. GET /api/ro/stock
```typescript
// File: app/api/ro/stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  try {
    const stock = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.article_code,
        s.article_name,
        s.ddd_stock,
        s.ljbb_stock,
        s.total_stock,
        r.ddd_available,
        r.ljbb_available,
        r.total_available
      FROM ro_stockwhs s
      LEFT JOIN ro_whs_readystock r ON s.article_code = r.article_code
      WHERE (s.article_code ILIKE ${`%${search}%`} OR s.article_name ILIKE ${`%${search}%`})
        AND r.total_available > 0
      ORDER BY s.article_code
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM ro_stockwhs s
      LEFT JOIN ro_whs_readystock r ON s.article_code = r.article_code
      WHERE (s.article_code ILIKE ${`%${search}%`} OR s.article_name ILIKE ${`%${search}%`})
        AND r.total_available > 0
    `;

    const total = Number(countResult[0].total);

    return NextResponse.json({
      success: true,
      data: stock,
      pagination: {
        page,
        limit,
        total,
        has_more: total > page * limit
      }
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock' },
      { status: 500 }
    );
  }
}
```

#### 3. POST /api/ro/requests
```typescript
// File: app/api/ro/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { store_name, items } = body;

    if (!store_name || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Store name and items are required' },
        { status: 400 }
      );
    }

    // Create request header
    const requestHeader = await prisma.ro_requests.create({
      data: {
        store_name,
        status: 'QUEUE',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Create process entries for each item
    const processEntries = await Promise.all(
      items.map((item: any) =>
        prisma.ro_process.create({
          data: {
            request_id: requestHeader.id,
            article_code: item.article_code,
            article_name: item.article_name,
            quantity: item.quantity,
            status: 'QUEUE',
            store_name,
            created_at: new Date(),
            updated_at: new Date()
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        request: requestHeader,
        processes: processEntries
      }
    });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create request' },
      { status: 500 }
    );
  }
}
```

### Component Structure

```
app/
├── api/
│   └── ro/
│       ├── recommendations/
│       │   └── route.ts      # GET recommendations
│       ├── stock/
│       │   └── route.ts      # GET stock search
│       └── requests/
│           └── route.ts      # POST new request
├── components/
│   └── ro/
│       ├── RequestForm.tsx       # Main form component
│       ├── AutoModal.tsx         # Auto recommendations modal
│       ├── AddModal.tsx          # Add article modal
│       ├── ArticleCard.tsx       # Article display card
│       ├── StockDisplay.tsx      # Stock info component
│       └── QuantityInput.tsx     # Quantity input with validation
├── hooks/
│   └── useStockAvailability.ts   # Hook for stock data
└── types/
    └── ro.ts                     # TypeScript interfaces
```

---

## 7. Implementation Steps

### Phase 1: Database Setup (Priority: CRITICAL)

- [ ] **Step 1.1**: Create `ro_recommendations` table
  ```sql
  CREATE TABLE ro_recommendations (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    article_code VARCHAR(100) NOT NULL,
    article_name VARCHAR(255) NOT NULL,
    recommendation INTEGER NOT NULL DEFAULT 0,
    assrt_status VARCHAR(100),
    broken_size VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **Step 1.2**: Create `ro_stockwhs` table
  ```sql
  CREATE TABLE ro_stockwhs (
    id SERIAL PRIMARY KEY,
    article_code VARCHAR(100) UNIQUE NOT NULL,
    article_name VARCHAR(255) NOT NULL,
    ddd_stock INTEGER NOT NULL DEFAULT 0,
    ljbb_stock INTEGER NOT NULL DEFAULT 0,
    total_stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **Step 1.3**: Create `ro_process` table
  ```sql
  CREATE TABLE ro_process (
    id SERIAL PRIMARY KEY,
    request_id INTEGER,
    article_code VARCHAR(100) NOT NULL,
    article_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUE',
    store_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **Step 1.4**: Create `ro_whs_readystock` VIEW
  ```sql
  CREATE OR REPLACE VIEW ro_whs_readystock AS
  SELECT 
    s.article_code,
    s.article_name,
    GREATEST(0, s.ddd_stock - COALESCE(SUM(CASE 
      WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
      THEN p.quantity ELSE 0 END), 0)) AS ddd_available,
    GREATEST(0, s.ljbb_stock - COALESCE(SUM(CASE 
      WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
      THEN p.quantity ELSE 0 END), 0)) AS ljbb_available,
    GREATEST(0, s.total_stock - COALESCE(SUM(CASE 
      WHEN p.status IN ('QUEUE', 'PROCESSING', 'DELIVERY', 'COMPLETE') 
      THEN p.quantity ELSE 0 END), 0)) AS total_available
  FROM ro_stockwhs s
  LEFT JOIN ro_process p ON s.article_code = p.article_code
  GROUP BY s.article_code, s.article_name, s.ddd_stock, s.ljbb_stock, s.total_stock;
  ```

- [ ] **Step 1.5**: Add indexes for performance
  ```sql
  CREATE INDEX idx_ro_process_article_status ON ro_process(article_code, status);
  CREATE INDEX idx_ro_process_store ON ro_process(store_name);
  CREATE INDEX idx_ro_recommendations_store ON ro_recommendations(store_name);
  CREATE INDEX idx_ro_stockwhs_article ON ro_stockwhs(article_code);
  ```

### Phase 2: Backend API (Priority: HIGH)

- [ ] **Step 2.1**: Create `/api/ro/recommendations` endpoint
- [ ] **Step 2.2**: Create `/api/ro/stock` endpoint
- [ ] **Step 2.3**: Create `/api/ro/requests` POST endpoint
- [ ] **Step 2.4**: Test all endpoints with sample data
- [ ] **Step 2.5**: Add error handling and validation

### Phase 3: Frontend Components (Priority: HIGH)

- [ ] **Step 3.1**: Create TypeScript types (`types/ro.ts`)
- [ ] **Step 3.2**: Create `StockDisplay` component
- [ ] **Step 3.3**: Create `ArticleCard` component
- [ ] **Step 3.4**: Create `AutoModal` component
- [ ] **Step 3.5**: Create `AddModal` component
- [ ] **Step 3.6**: Update `RequestForm.tsx` with new features

### Phase 4: Integration & Testing (Priority: MEDIUM)

- [ ] **Step 4.1**: Connect frontend to backend APIs
- [ ] **Step 4.2**: Test AUTO button flow
- [ ] **Step 4.3**: Test + ADD button flow
- [ ] **Step 4.4**: Test stock display updates
- [ ] **Step 4.5**: Test form submission
- [ ] **Step 4.6**: Test edge cases (no stock, no recommendations, etc.)

### Phase 5: Data Population (Priority: MEDIUM)

- [ ] **Step 5.1**: Import initial stock data to `ro_stockwhs`
- [ ] **Step 5.2**: Import recommendations to `ro_recommendations`
- [ ] **Step 5.3**: Verify VIEW calculations are correct
- [ ] **Step 5.4**: Test with real data volumes

### Phase 6: Polish & Optimization (Priority: LOW)

- [ ] **Step 6.1**: Add loading states
- [ ] **Step 6.2**: Add error messages
- [ ] **Step 6.3**: Add empty states
- [ ] **Step 6.4**: Optimize API response times
- [ ] **Step 6.5**: Add caching if needed
- [ ] **Step 6.6**: Mobile responsiveness check

### Testing Strategy

#### Unit Tests
- [ ] Test VIEW calculation logic
- [ ] Test API endpoint responses
- [ ] Test component rendering

#### Integration Tests
- [ ] Test complete AUTO flow
- [ ] Test complete ADD flow
- [ ] Test stock deduction on request creation
- [ ] Test stock restoration on cancellation

#### E2E Tests
- [ ] User creates request using AUTO button
- [ ] User creates request using ADD button
- [ ] User submits request and stock updates
- [ ] User cancels request and stock restores

#### Performance Tests
- [ ] Test with 1000+ stock items
- [ ] Test with 100+ recommendations
- [ ] Test VIEW query performance

---

## Appendix A: Sample Data

### Sample ro_stockwhs Data
```sql
INSERT INTO ro_stockwhs (article_code, article_name, ddd_stock, ljbb_stock, total_stock) VALUES
('ART001', 'Nike Air Max', 100, 50, 150),
('ART002', 'Adidas Ultraboost', 75, 75, 150),
('ART003', 'Puma RS-X', 50, 50, 100);
```

### Sample ro_recommendations Data
```sql
INSERT INTO ro_recommendations (store_name, article_code, article_name, recommendation, assrt_status, broken_size) VALUES
('Store A', 'ART001', 'Nike Air Max', 10, 'Active', 'M,L'),
('Store A', 'ART002', 'Adidas Ultraboost', 5, 'Active', 'S'),
('Store B', 'ART001', 'Nike Air Max', 8, 'Active', NULL);
```

### Sample ro_process Data
```sql
INSERT INTO ro_process (request_id, article_code, article_name, quantity, status, store_name) VALUES
(1, 'ART001', 'Nike Air Max', 5, 'QUEUE', 'Store A'),
(1, 'ART002', 'Adidas Ultraboost', 3, 'PROCESSING', 'Store A');
```

---

## Appendix B: Troubleshooting Guide

### Issue: VIEW returns negative stock
**Solution**: Use `GREATEST(0, ...)` in VIEW definition to prevent negative values

### Issue: Slow query performance
**Solution**: 
1. Add indexes on `ro_process(article_code, status)`
2. Add indexes on `ro_stockwhs(article_code)`
3. Consider materialized view if data is large and real-time isn't critical

### Issue: Stock not updating after request
**Solution**: Verify ro_process entries are being created with status 'QUEUE' or other subtracting status

### Issue: Recommendations not showing
**Solution**: Check that:
1. Store name matches exactly (case-sensitive)
2. recommendation > 0
3. Stock is available in ro_whs_readystock

---

## Document Information

- **Created**: 2026-01-29
- **Version**: 1.0
- **Author**: AI Assistant
- **Status**: Implementation Ready
- **Next Review**: Upon completion of Phase 1
