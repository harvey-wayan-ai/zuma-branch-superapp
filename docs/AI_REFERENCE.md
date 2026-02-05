# AI Reference Hub - Zuma RO PWA

> **🤖 AI AGENTS: START HERE**
> 
> This is the central knowledge hub for all AI agents working on the Zuma RO PWA project. 
> All documentation references and application logic flowcharts are linked from this file.

---

## 📋 Quick Navigation

### For New AI Agents
1. **Read this file first** (you're here!)
2. **Understand the app logic:** [`APP_LOGIC.md`](./APP_LOGIC.md) - Complete flowcharts and data flows
3. **Check current status:** [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) - What's done, what's pending
4. **Understand the database:** [`DATABASE_LOGIC.md`](./DATABASE_LOGIC.md) - Table structures and relationships

### By Task Type

| If you need to... | Read this |
|-------------------|-----------|
| Understand overall app flow | [`APP_LOGIC.md`](./APP_LOGIC.md) |
| Check what's been built | [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) |
| Understand database schema | [`DATABASE_LOGIC.md`](./DATABASE_LOGIC.md) |
| Work on DNPB matching | [`DNPB_MATCHING_LOGIC.md`](./DNPB_MATCHING_LOGIC.md) |
| Work on authentication | [`AUTH_IMPLEMENTATION_PLAN.md`](./AUTH_IMPLEMENTATION_PLAN.md) |
| Debug issues | [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) |
| See recent changes | [`opencode_kimi_k25.md`](../opencode_kimi_k25.md) |
| Understand RO request flow | [`RO_REQUEST_ARCHITECTURE.md`](./RO_REQUEST_ARCHITECTURE.md) |

---

## 🏗️ Project Overview

**Project Name:** Zuma Branch Super App (RO PWA)  
**Version:** v1.2.6  
**Live URL:** https://zuma-ro-pwa.vercel.app  
**Repository:** https://github.com/harvey-wayan-ai/zuma-branch-superapp  

### What This App Does
A mobile-first Progressive Web Application for Zuma Indonesia retail stores to:
- **Create Replenishment Orders (RO)** - Order stock from warehouses
- **Track RO Status** - 9-stage workflow from QUEUE to COMPLETED
- **Manage DNPB** - Delivery note matching to prevent double-counting
- **Handle Discrepancies** - Banding (dispute) or Confirm (accept) when physical stock doesn't match
- **View Warehouse Stock** - Real-time inventory dashboard

### Core Workflow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Create    │───▶│   Process   │───▶│   Deliver   │───▶│   Resolve   │
│     RO      │    │    RO       │    │     RO      │    │  Discrepancy│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼
RequestForm.tsx     ROProcess.tsx      DNPB Input        DNPB Error Tab
   (Create)         (9 Stages)       (Dual DNPB)      (Banding/Confirmed)
```

---

## 📚 Complete Documentation Index

### Core Documentation
| File | Purpose | Last Updated |
|------|---------|--------------|
| [`APP_LOGIC.md`](./APP_LOGIC.md) | **Complete app flowcharts and logic** | 2026-02-05 |
| [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) | Feature status and roadmap | 2026-02-05 |
| [`DATABASE_LOGIC.md`](./DATABASE_LOGIC.md) | Table schemas and relationships | 2026-01-30 |
| [`DNPB_MATCHING_LOGIC.md`](./DNPB_MATCHING_LOGIC.md) | DNPB validation and matching | 2026-02-05 |

### Architecture & Planning
| File | Purpose |
|------|---------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | High-level system architecture |
| [`RO_REQUEST_ARCHITECTURE.md`](./RO_REQUEST_ARCHITECTURE.md) | RO submission flow |
| [`RO_WHS_READYSTOCK_VIEW.md`](./RO_WHS_READYSTOCK_VIEW.md) | Stock calculation view |
| [`AUTH_IMPLEMENTATION_PLAN.md`](./AUTH_IMPLEMENTATION_PLAN.md) | Authentication design |

### Operations & Debugging
| File | Purpose |
|------|---------|
| [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) | Common issues and fixes |
| [`AUDIT_REPORT_2026-01-30.md`](./AUDIT_REPORT_2026-01-30.md) | Security audit results |
| [`SUPABASE_AUTH_SETUP_GUIDE.md`](./SUPABASE_AUTH_SETUP_GUIDE.md) | Auth setup instructions |

### Progress & Session Logs
| File | Purpose |
|------|---------|
| [`opencode_kimi_k25.md`](../opencode_kimi_k25.md) | Session-by-session progress log |
| [`README.md`](../README.md) | Project overview (user-facing) |

---

## 🎯 Current Priorities (As of v1.2.6)

### Recently Completed ✅
- [x] Dual DNPB support (DDD + LJBB warehouses)
- [x] DNPB Error tab with Banding/Confirmed actions
- [x] Authentication Phase 1 (basic login)
- [x] Real-time warehouse stock dashboard

### Next Up 🚧
- [ ] Authentication Phase 2 (RBAC: AS, WH SPV, WH Admin, WH Helper)
- [ ] Push notifications for RO status changes
- [ ] Offline sync capability

---

## 🔧 Tech Stack Reminder

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Deployment | Vercel |

---

## 📝 Important Notes for AI Agents

### 1. Schema Location
**ALL database operations use schema `branch_super_app_clawdbot`**
```typescript
const { data } = await supabase
  .schema("branch_super_app_clawdbot")  // ← ALWAYS include this
  .from("ro_process")
  .select("*")
```

### 2. Dual DNPB Logic (v1.2.6+)
- ROs can have **both** DDD and LJBB DNPB numbers
- Each validated against its respective transaction table
- Dynamic form shows inputs only for warehouses with boxes

### 3. Banding vs Confirmed
| Action | Result |
|--------|--------|
| **Banding** | Creates dispute notice, RO stays open |
| **Confirmed** | RO marked COMPLETED, quantities adjusted to fisik |

### 4. Critical Files
- **API Routes:** `/app/api/ro/*.ts`
- **Components:** `/components/ROPage.tsx`, `/components/ROProcess.tsx`
- **Database:** `/migrations/*.sql`

---

## 🔗 External Resources

- **Live App:** https://zuma-ro-pwa.vercel.app
- **Login:** https://zuma-ro-pwa.vercel.app/login
- **Supabase Dashboard:** https://supabase.com/dashboard/project/rwctwnzckyepiwcufdlw
- **GitHub Repo:** https://github.com/harvey-wayan-ai/zuma-branch-superapp

---

## 🆘 Need Help?

1. **Check [`APP_LOGIC.md`](./APP_LOGIC.md)** for flowcharts
2. **Check [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md)** for common issues
3. **Check [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)** for current state
4. **Ask the user** if still unclear

---

*This file is the single source of truth for AI agent navigation.*  
*Last Updated: 2026-02-05*  
*Maintained by: AI Agents working on Zuma RO PWA*
