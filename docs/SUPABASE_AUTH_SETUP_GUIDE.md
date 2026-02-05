# Supabase Auth Setup Guide - Zuma RO PWA

> **AI Agent Reference:** For complete app navigation, see [`AI_REFERENCE.md`](./AI_REFERENCE.md)  
> **Related:** [`AUTH_IMPLEMENTATION_PLAN.md`](./AUTH_IMPLEMENTATION_PLAN.md) - Auth design | [`APP_LOGIC.md`](./APP_LOGIC.md) - Auth flowcharts

**Project:** Zuma Branch Super App  
**Date:** 2026-01-31  
**Purpose:** Configure Supabase Dashboard for Authentication  

---

## Prerequisites

- Supabase project URL: https://supabase.com/dashboard/project/rwctwnzckyepiwcufdlw
- Production URL: https://zuma-ro-pwa.vercel.app
- Admin access to Supabase Dashboard

---

## Step 1: Configure URL Settings

### 1.1 Navigate to URL Configuration
1. Go to https://supabase.com/dashboard
2. Sign in with your account
3. Select project: **rwctwnzckyepiwcufdlw** (Zuma RO PWA)
4. In the left sidebar, click **Authentication**
5. Click **URL Configuration** (under Configuration section)

### 1.2 Set Site URL
**Current value:** `http://localhost:3000` (default)

**Change to:**
```
https://zuma-ro-pwa.vercel.app
```

**Why:** This is the default redirect URL when users complete authentication.

### 1.3 Add Redirect URLs
**Current:** May be empty or have localhost

**Add these exact URLs:**
```
https://zuma-ro-pwa.vercel.app
https://zuma-ro-pwa.vercel.app/**
https://zuma-ro-pwa.vercel.app/login
```

**Why:** Supabase only redirects to URLs in this list for security.

### 1.4 Save Changes
Click the **Save** button at the bottom of the page.

**Expected result:** Green success message "Settings saved"

---

## Step 2: Verify Email Auth Provider

### 2.1 Navigate to Auth Providers
1. In left sidebar, click **Authentication**
2. Click **Providers** (under Configuration section)
3. Find **Email** provider in the list

### 2.2 Verify Settings
**Should be:**
- Status: **Enabled** (green toggle)
- Confirm email: **Enabled** (optional - disable for easier testing)
- Secure email change: **Enabled**
- Allow new users to sign up: **Enabled**

### 2.3 Optional: Disable Email Confirmation (for testing)
If you want to skip email verification during testing:
1. Toggle **Confirm email** to **OFF**
2. Click **Save**

**Note:** Re-enable this in production for security.

---

## Step 3: Create Test Users

### 3.1 Navigate to Users
1. In left sidebar, click **Authentication**
2. Click **Users** (under User Management section)
3. Click **Add user** button (top right)

### 3.2 Create Area Supervisor Test User
**Form fields:**
- Email: `as@zuma.id`
- Password: `Test123!`
- Auto-confirm email: **Checked** (if available)

Click **Create user**

### 3.3 Create Warehouse Supervisor Test User
**Form fields:**
- Email: `whspv@zuma.id`
- Password: `Test123!`
- Auto-confirm email: **Checked**

Click **Create user**

### 3.4 Create Admin Test User
**Form fields:**
- Email: `admin@zuma.id`
- Password: `Admin123!`
- Auto-confirm email: **Checked**

Click **Create user**

### 3.5 Verify Users Created
You should see 3 users in the list with:
- Green dot (confirmed status)
- Last sign-in: Never (expected)
- Provider: Email

---

## Step 4: Test Authentication

### 4.1 Open Production App
Go to: https://zuma-ro-pwa.vercel.app

### 4.2 Verify Redirect to Login
**Expected:** You should be redirected to `/login` automatically

### 4.3 Test Login
1. Enter email: `as@zuma.id`
2. Enter password: `Test123!`
3. Click **Sign In**

**Expected:**
- Toast notification: "Welcome back!"
- Redirect to home page `/`
- App functions normally

### 4.4 Test API Protection
Try accessing an API directly without login:
```
https://zuma-ro-pwa.vercel.app/api/ro/dashboard
```

**Expected:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

HTTP Status: **401 Unauthorized**

### 4.5 Test Logout (Future Feature)
Currently logout is not implemented in UI. To test logout:
1. Clear browser cookies for zuma-ro-pwa.vercel.app
2. Refresh page
3. Should redirect to `/login`

---

## Troubleshooting

### Issue: "Invalid login credentials"
**Cause:** Email not confirmed or wrong password

**Solution:**
1. Go to Authentication → Users
2. Find the user
3. Check if email is confirmed (green dot)
4. If not, click user → Confirm email
5. Or reset password using "Send password reset" button

### Issue: "Unauthorized" after login
**Cause:** Session not persisting

**Solution:**
1. Check browser cookies are enabled
2. Verify Site URL matches exactly (no trailing slash issues)
3. Check browser console for errors

### Issue: Redirect loop (login → home → login)
**Cause:** Middleware redirect conflict

**Solution:**
1. Clear all cookies for the domain
2. Check Redirect URLs include `/login`
3. Verify middleware.ts matcher pattern

### Issue: "Email not confirmed"
**Cause:** Email confirmation is enabled but email not verified

**Solution:**
1. Disable "Confirm email" in Providers → Email (for testing)
2. Or click confirmation link in email (if SMTP configured)
3. Or manually confirm user in Dashboard → Users → Click user → Confirm email

---

## Next Steps (After Setup)

### Phase 2: Role-Based Access Control
After basic auth is working, implement roles:

1. Create `user_roles` table in `branch_super_app_clawdbot` schema
2. Link to `auth.users` via foreign key
3. Add custom JWT claims for roles
4. Update API routes to check roles

See `docs/AUTH_IMPLEMENTATION_PLAN.md` for Phase 2 details.

---

## Environment Variables Reference

**Already configured in Vercel:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://rwctwnzckyepiwcufdlw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

**No changes needed** - auth system uses existing variables.

---

## Quick Reference Card

| Task | Location | Action |
|------|----------|--------|
| Enable Email Auth | Auth → Providers → Email | Toggle ON |
| Set Site URL | Auth → URL Configuration | Set to production URL |
| Add Redirect URLs | Auth → URL Configuration | Add `/**` wildcard |
| Create User | Auth → Users → Add user | Fill form |
| Confirm Email | Auth → Users → Click user | Click "Confirm email" |
| Reset Password | Auth → Users → Click user | Click "Send password reset" |

---

## Support

**Supabase Documentation:**
- Auth Overview: https://supabase.com/docs/guides/auth
- Password Auth: https://supabase.com/docs/guides/auth/passwords
- Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls

**Project Files:**
- Auth Plan: `docs/AUTH_IMPLEMENTATION_PLAN.md`
- Login Page: `app/login/page.tsx`
- Middleware: `middleware.ts`

---

**Setup Complete!** 🎉

Once these steps are done, the authentication system will be fully functional.
