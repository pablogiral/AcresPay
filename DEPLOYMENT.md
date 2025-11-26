# Deployment Guide

This guide covers deploying AcresPay to Vercel and testing locally.

## Prerequisites

- **Node.js** 18+
- **npm** or yarn
- **PostgreSQL** (local dev or managed service like Neon, Railway, Supabase)
- **Vercel account** and GitHub repo connected

## Local Production Build & Test

### 1. Setup Environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Random secret (e.g., `openssl rand -base64 32`)
- `NODE_ENV=production` (when testing locally)

Optional (for auth):
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `APP_BASE_URL` (defaults to `http://localhost:5000`)

### 2. Build

```bash
npm install
npm run build
```

Output:
- `dist/public/`: Compiled React frontend (SPA)
- `dist/index.js`: Bundled Express backend

### 3. Run & Test

```bash
NODE_ENV=production npm start
```

Visit `http://localhost:5000` in your browser.

Test endpoints:
- `GET /api/auth/user` → should return 401 (unauthenticated) or user JSON (with dev user in dev mode)
- `POST /api/auth/register` → register local user
- `POST /api/auth/login` → login with email/password
- `/api/auth/google` → redirect to Google OAuth

## Vercel Deployment

### 1. Connect Repository

In Vercel dashboard:
1. New Project → Import Git Repository → select your repo
2. Framework: Auto-detect (should be "Other")
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Install Command: `npm install`

### 2. Environment Variables

In Vercel project settings → Environment Variables, add:

**Required**:
```
DATABASE_URL=postgresql://...
SESSION_SECRET=<random_base64_string>
NODE_ENV=production
```

**Optional (for Google OAuth)**:
```
GOOGLE_CLIENT_ID=<your_client_id>
GOOGLE_CLIENT_SECRET=<your_client_secret>
APP_BASE_URL=https://<your-vercel-domain>.vercel.app
```

### 3. Google OAuth Setup (if using)

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URIs:
   - Local: `http://localhost:5000/api/auth/google/callback`
   - Vercel: `https://<your-vercel-domain>.vercel.app/api/auth/google/callback`
4. Copy Client ID and Client Secret → Vercel env vars

### 4. Database Setup

If using managed database (Neon, Railway, etc.):
1. Create a PostgreSQL database
2. Get connection string (e.g., `postgresql://user:pass@host:5432/dbname`)
3. Add to `DATABASE_URL` env var in Vercel
4. ✅ Vercel will auto-apply schema on first connect (via `npm run db:push` in build if configured)

### 5. Deploy

Push to main branch → Vercel auto-deploys.

Monitor deployment:
- Vercel dashboard logs
- Check `/` → should see login page
- Test `/api/auth/user` → 401 or user JSON

### 6. Troubleshooting

**Build fails:**
- Check `npm run check` locally for TypeScript errors
- Ensure all env vars are set in Vercel

**Authentication fails:**
- For Google: verify `APP_BASE_URL` matches Vercel domain exactly
- For local auth: POST to `/api/auth/register` with `{ email, password, firstName?, lastName? }`

**Database connection fails:**
- Test `DATABASE_URL` locally with `npm run db:push`
- Ensure Neon/Railway/Supabase firewall allows Vercel IPs

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push:
- TypeScript check (`npm run check`)
- Build (`npm run build`)
- Validates before Vercel deploys

## Production Checklist

- [ ] All env vars set in Vercel
- [ ] `DATABASE_URL` tested and working
- [ ] `SESSION_SECRET` is random and secure
- [ ] Google OAuth (if used) callback URLs configured
- [ ] GitHub Actions passing
- [ ] Vercel build succeeds
- [ ] `/api/auth/user` returns correct user data
- [ ] Frontend loads at `/`
- [ ] Login/register pages work
- [ ] API routes respond with correct data
