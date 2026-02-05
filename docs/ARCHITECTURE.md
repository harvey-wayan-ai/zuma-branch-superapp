# Branch Super App - Architecture Design

> **AI Agent Reference:** For complete app navigation, see [`AI_REFERENCE.md`](./AI_REFERENCE.md)  
> **Related:** [`APP_LOGIC.md`](./APP_LOGIC.md) - Application flowcharts | [`DATABASE_LOGIC.md`](./DATABASE_LOGIC.md) - Data models

## 1. Overview
A PWA tool for Branch Managers to track Sales Performance and manage Inventory (RO).

## 2. Data Sources
- **Sales Data:** Supabase (Synced from iSeller). 
  - *Strategy:* Use PostgreSQL Views for heavy aggregations (Daily/Monthly Sales) to keep the app snappy.
- **Inventory & RO:** Google Sheets.
  - *Strategy:* Next.js Server Actions to fetch and update status.

## 3. Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + Shadcn UI
- **State Management:** React Server Components + Actions
- **Database:** Supabase (PostgreSQL)
- **External API:** Google Sheets API

## 4. UI Components (Mobile-First)
- **Dashboard:** Sales Charts, Performance Metrics.
- **Inventory:** Table with Stock levels & RO Recommendation logic.
- **Forms:** RO Request Submission.

## 5. Development Strategy (Orchestration)
- **Lead Agent:** Harvey (Sonnet 4.5/DeepSeek)
- **Sub-agents:** DeepSeek-V3 / GPT-4o-mini for:
  - Component scaffolding.
  - API route implementation.
  - Type definitions.
