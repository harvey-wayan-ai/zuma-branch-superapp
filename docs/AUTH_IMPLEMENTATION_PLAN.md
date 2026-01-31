# Authentication & Security Implementation Plan

**Project:** Zuma RO PWA  
**Date:** 2026-01-31  
**Status:** Phase 1 - Core Auth Setup  

---

## Current State

**Authentication:** NONE  
**Authorization:** NONE  
**API Security:** All 10 API routes are publicly accessible  

### Existing Infrastructure
- Supabase project configured (`rwctwnzckyepiwcufdlw.supabase.co`)
- `@supabase/supabase-js` already installed
- No middleware, no login page, no auth checks

---

## Implementation Plan

### Phase 1: Core Authentication (This Session)

#### 1.1 Install Required Package
```bash
npm install @supabase/ssr
```

**Why `@supabase/ssr`:**
- Official Supabase package for Next.js App Router
- Replaces deprecated `@supabase/auth-helpers-nextjs`
- Supports Server Components, Client Components, Middleware, and API routes
- Cookie-based session management

#### 1.2 Environment Variables
Add to `.env.local`:
```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=https://rwctwnzckyepiwcufdlw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# New - for auth
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Note:** The publishable key is different from service role key - it's safe to expose in client-side code.

#### 1.3 Create Auth Utilities

**File:** `lib/supabase/server.ts`
- Server-side Supabase client with auth
- Async cookies() for Next.js 15
- Used in Server Components and API routes

**File:** `lib/supabase/client.ts`
- Browser-side Supabase client
- Used in Client Components (login form)

**File:** `lib/supabase/middleware.ts`
- Session refresh logic
- Route protection
- Used in `middleware.ts`

#### 1.4 Create Middleware

**File:** `middleware.ts` (root level)
- Protects all routes except `/login`
- Refreshes session automatically
- Redirects unauthenticated users to login

**Matcher config:**
```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
```

#### 1.5 Create Login Page

**File:** `app/login/page.tsx`
- Email/password login form
- Zuma brand styling (#0D3B2E, #00D084)
- Mobile-first responsive design
- Error handling with toast notifications

**Features:**
- Email input
- Password input
- Login button
- "Remember me" option (optional)
- Error messages

#### 1.6 Update Root Layout

**File:** `app/layout.tsx`
- Add auth provider (if needed for client-side auth state)
- Keep existing Toaster for notifications

#### 1.7 Protect API Routes

**Files:** All `app/api/*/route.ts`

Add auth check to each API route:
```typescript
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // ... rest of handler
}
```

**Routes to protect:**
- [ ] `app/api/articles/route.ts`
- [ ] `app/api/stores/route.ts`
- [ ] `app/api/update-ro/route.ts`
- [ ] `app/api/ro/articles/route.ts`
- [ ] `app/api/ro/dashboard/route.ts`
- [ ] `app/api/ro/dnpb/route.ts`
- [ ] `app/api/ro/process/route.ts`
- [ ] `app/api/ro/recommendations/route.ts`
- [ ] `app/api/ro/status/route.ts`
- [ ] `app/api/ro/submit/route.ts`

---

## User Roles (Future Phase 2)

Based on Zuma business requirements:

| Role | Code | Permissions |
|------|------|-------------|
| Area Supervisor | `AS` | Create ROs, view dashboard |
| Warehouse Supervisor | `WH_SPV` | Approve ROs, confirm arrivals, full access |
| Warehouse Admin | `WH_ADMIN` | Verify picks, generate DNPB/SOPB |
| Warehouse Helper | `WH_HELPER` | Pick stock, manage delivery |

**Phase 2 Implementation:**
1. Create `user_roles` table in Supabase
2. Add custom JWT claims hook
3. Implement role-based API access
4. Update UI based on role

---

## Security Considerations

### Immediate (Phase 1)
- [x] All API routes require authentication
- [x] Session tokens stored in HTTP-only cookies
- [x] Automatic session refresh via middleware
- [x] CSRF protection via SameSite cookies

### Future (Phase 2+)
- [ ] Row Level Security (RLS) policies
- [ ] Role-based access control
- [ ] Rate limiting
- [ ] Audit logging (who did what)
- [ ] Password strength requirements
- [ ] Session timeout handling

---

## Testing Checklist

### Phase 1 Testing
- [ ] Can access `/login` without auth
- [ ] Cannot access `/` (home) without auth → redirects to login
- [ ] Can login with valid credentials
- [ ] Shows error on invalid credentials
- [ ] Can access protected routes after login
- [ ] API routes return 401 without auth
- [ ] API routes work with valid auth
- [ ] Session persists across page refreshes
- [ ] Logout functionality works

### User Flow Testing
- [ ] User visits app → redirected to login
- [ ] User enters credentials → logs in
- [ ] User sees home page
- [ ] User can use all features
- [ ] User closes tab, reopens → still logged in
- [ ] User clicks logout → redirected to login

---

## Files to Create/Modify

### New Files
```
lib/supabase/server.ts      # Server-side auth client
lib/supabase/client.ts      # Browser auth client
lib/supabase/middleware.ts  # Session refresh logic
app/login/page.tsx          # Login page UI
middleware.ts               # Route protection
```

### Modified Files
```
app/layout.tsx              # Add auth provider
.env.local                  # Add publishable key
package.json                # Add @supabase/ssr
app/api/*/route.ts          # Add auth checks (10 files)
```

---

## Supabase Dashboard Setup Required

1. **Enable Email Auth:**
   - Go to Authentication → Providers
   - Enable "Email" provider
   - Configure email templates (optional)

2. **Create Test Users:**
   - Go to Authentication → Users
   - Add test users for each role
   - Note: Will need to set passwords via email or SQL

3. **Site URL:**
   - Go to Authentication → URL Configuration
   - Set Site URL: `https://zuma-ro-pwa.vercel.app`
   - Set Redirect URLs: `https://zuma-ro-pwa.vercel.app/auth/callback`

---

## Deployment Notes

1. **Environment Variables:**
   - Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Vercel
   - Keep `SUPABASE_SERVICE_ROLE_KEY` server-only

2. **Build:**
   - Run `npm run build` to verify
   - Check for TypeScript errors

3. **Post-Deploy:**
   - Test login flow immediately
   - Verify all API routes return 401 when unauthenticated

---

## References

- **Supabase Auth + Next.js 15:** https://supabase.com/docs/guides/auth/server-side/nextjs
- **SSR Package:** https://supabase.com/docs/guides/auth/server-side/creating-a-client
- **RBAC Guide:** https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac

---

**Next Steps:**
1. Review and approve this plan
2. Set up Supabase Auth in dashboard
3. Implement Phase 1
4. Test thoroughly
5. Deploy to production
