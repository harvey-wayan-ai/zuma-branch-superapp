# Credentials & API Tokens Reference

## ⚠️ IMPORTANT: All credentials are stored OUTSIDE the git repository

This file documents where credentials are located. **DO NOT** commit actual credentials to git.

---

## 1. Supabase Database

**Location:** `~/.env.database.local` (in home directory, NOT in project folder)

```bash
# SSH into server and read:
cat ~/.env.database.local
```

**Contents:**
- Database URL
- Username: postgres
- Password: Database_2112!
- Host: db.rwctwnzckyepiwcufdlw.supabase.co
- Schema: branch_super_app_clawdbot

---

## 2. GitHub Personal Access Token (PAT)

**Location:** `~/.github-token` (in home directory)

```bash
cat ~/.github-token
```

**Used for:** Pushing to GitHub repositories

---

## 3. Vercel Token

**Location:** `~/.vercel-token` (in home directory)

```bash
cat ~/.vercel-token
```

**Format:** `VERCEL_TOKEN=460yYkMWVVDo91Rv32woReyX`

**Used for:** Deploying to Vercel via CLI

---

## 4. Notion API Key

**Location:** `~/.config/notion/api_key` (in home directory)

```bash
cat ~/.config/notion/api_key
```

**Used for:** Accessing Notion workspace and tasks

---

## 5. Google OAuth Credentials

**Location:** 
- `~/.google-credentials.json`
- `~/.google-oauth-credentials.json`

**Used for:** Google Drive, Gmail, Google Sheets access

---

## 6. Environment Files (Project Level)

**Files that exist but are gitignored:**
- `.env.local`
- `.env.database.local` (in project root)

**DO NOT commit these!** They are already in `.gitignore`.

---

## Quick Access Commands

```bash
# Supabase credentials
cat ~/.env.database.local

# GitHub token
cat ~/.github-token

# Vercel token
cat ~/.vercel-token

# Notion API key
cat ~/.config/notion/api_key
```

---

## Security Notes

1. ✅ All credential files are in `.gitignore`
2. ✅ No credentials are committed to the repository
3. ✅ Credentials are stored in home directory (`~`) or `.config/`
4. ⚠️ Never commit `.env` files or token files
5. ⚠️ Never share these credentials in chat logs

---

## For Next AI Agent

When you need credentials:
1. Check this file for location
2. Read from the specified location
3. Use the credentials but don't log them
4. Never commit them to git

If a credential file is missing, ask the user for it.
