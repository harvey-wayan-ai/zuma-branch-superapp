# Zuma Branch Super App

A mobile-first Progressive Web Application (PWA) for Zuma Indonesia retail store management and RO (Replenishment Orders) processing.

[![Deploy on Vercel](https://img.shields.io/badge/Vercel-Live-success?style=flat&logo=vercel)](https://zuma-ro-pwa.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)

## 🎯 Overview

Zuma Branch Super App is a comprehensive mobile-first PWA designed for Zuma Indonesia's retail store management. It streamlines the replenishment order (RO) process, provides real-time inventory insights, and offers sales analytics to help store managers make data-driven decisions.

The app features a modern, responsive dark theme with Zuma branding, optimized for mobile devices while maintaining full functionality on desktop.

## ✨ Features

### Navigation & Structure
- **5-Tab Navigation System**:
  - 🏠 **Home** - Dashboard overview with key metrics
  - 📦 **SKU** - Product catalog and inventory lookup
  - ⚡ **Action** - Quick actions and notifications center
  - 🔄 **RO** - Replenishment Orders management
  - ⚙️ **Settings** - System configuration and status

### RO (Replenishment Order) Management
- **RO Dashboard** - Real-time statistics and visual metrics
- **RO Request Form** - Smart form with auto-generated recommendations
- **RO Process Tracking** - 8-stage timeline visualization:
  1. Queue
  2. Checking
  3. Checking 2
  4. Warehouse Allocation
  5. Packing
  6. Delivery
  7. Received
  8. Done

### Analytics & Reporting
- **Sales Analytics Dashboard** with 7 breakdown tables:
  - Sales by Gender (Men/Ladies/Junior/Girls/Boys/Baby)
  - Sales by Series (AirMove, BlackSeries, Classic, etc.)
  - Sales by Store Location
  - Daily/Weekly/Monthly trends
  - Top performing products
  - Inventory status overview

### User Experience
- Mobile-first responsive design
- Dark theme with Zuma green branding (#00A86B)
- Real-time data synchronization
- Offline capability (PWA)
- Smooth animations with Framer Motion
- Toast notifications for user feedback

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn/ui** - Modern component library
- **Framer Motion** - Animation library
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend
- **Supabase** - PostgreSQL database with realtime subscriptions
- **Row Level Security (RLS)** - Secure data access
- **Database Triggers** - Auto-calculation of ready stock

### Deployment
- **Vercel** - Edge deployment with automatic CI/CD
- **PWA Support** - Service worker and manifest

## 🗄️ Database Architecture

### Core Tables

#### 1. `ro_stockwhs` - Master Warehouse Stock
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| article_code | VARCHAR(50) | Unique product code |
| article_name | VARCHAR(255) | Product full name |
| ddd_stock | INTEGER | DDD warehouse stock |
| ljbb_stock | INTEGER | LJBB warehouse stock |
| total_stock | INTEGER | Total combined stock |
| last_updated | TIMESTAMP | Last sync timestamp |
| sync_source | VARCHAR(100) | Source of sync |

#### 2. `ro_process` - Active RO Allocations
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| ro_id | VARCHAR(50) | RO request ID |
| article_code | VARCHAR(50) | Product code |
| boxes_requested | INTEGER | Boxes requested |
| boxes_allocated_ddd | INTEGER | Boxes from DDD |
| boxes_allocated_ljbb | INTEGER | Boxes from LJBB |
| status | VARCHAR(50) | Current stage status |
| store_id | UUID | Store location |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

#### 3. `ro_whs_readystock` - Available Stock
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| article_code | VARCHAR(50) | Unique product code |
| article_name | VARCHAR(255) | Product name |
| ddd_available | INTEGER | Available at DDD |
| ljbb_available | INTEGER | Available at LJBB |
| total_available | INTEGER | Total available |
| last_calculated | TIMESTAMP | Calculation time |

#### 4. `ro_recommendations` - Auto-Generated Suggestions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| store_name | TEXT | Store location |
| article_mix | TEXT | Article identifier |
| gender | TEXT | Product gender category |
| series | TEXT | Product series |
| article | TEXT | Full article name |
| tier | INTEGER | Priority tier |
| total_recommendation | INTEGER | Recommended quantity |
| recommendation_box | INTEGER | Boxes to order |
| kode_kecil | INTEGER | Small code quantity |
| assay_status | TEXT | Stock status (FULL/BROKEN) |
| broken_sizes | TEXT | Missing size details |

### Business Logic
```
ro_whs_readystock = ro_stockwhs - ro_process
```

Ready stock is automatically calculated by subtracting active RO allocations from master warehouse stock. This is handled via PostgreSQL triggers for real-time updates.

## 🚀 Live Demo

**Production URL**: [https://zuma-ro-pwa.vercel.app](https://zuma-ro-pwa.vercel.app)

## 📱 Screenshots

*Coming soon - Add mobile and desktop screenshots here*

## 🏃 Development

### Prerequisites
- Node.js 20+
- npm or pnpm
- Supabase account

### Installation

```bash
# Clone repository
git clone https://github.com/harvey-wayan-ai/zuma-branch-superapp.git
cd zuma-branch-superapp

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rwctwnzckyepiwcufdlw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Supabase Schema Setup

Run the SQL migration files in order:
1. `supabase/migrations/001_create_ro_stockwhs.sql`
2. `supabase/migrations/002_create_ro_process.sql`
3. `supabase/migrations/003_create_ro_whs_readystock.sql`
4. `supabase/migrations/004_create_triggers.sql`

## 📊 Data Flow

1. **Master Stock Sync** - `ro_stockwhs` synced from WHS system
2. **RO Request** - Store manager submits RO via form
3. **Allocation** - System allocates from DDD/LJBB in `ro_process`
4. **Auto-Calculation** - Trigger updates `ro_whs_readystock`
5. **Recommendation Engine** - Generates suggestions based on sales data
6. **Tracking** - RO status updated through 8-stage timeline

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Store-based access control
- Service role key for server-side operations
- Anon key for client-side with appropriate policies

## 📝 Roadmap

- [x] 5-tab navigation system
- [x] RO Dashboard with stats
- [x] RO Request Form
- [x] RO Process 8-stage timeline
- [x] Sales analytics with 7 tables
- [x] Settings with system status
- [x] PWA support
- [x] Supabase integration
- [x] Vercel deployment
- [ ] Push notifications
- [ ] Offline sync
- [ ] Multi-store support
- [ ] Advanced reporting

## 🤝 Contributing

This is an internal project for Zuma Indonesia. For access or contributions, please contact the development team.

## 📄 License

© 2026 Zuma Indonesia. All rights reserved.

---

Built with ❤️ by Harvey (AI Assistant) for Zuma Indonesia
