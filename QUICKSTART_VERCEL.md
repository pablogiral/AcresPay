# Quick Start: Deploy to Vercel

## 1. Local Test (Optional)

```bash
# Install and build
npm install
npm run build

# Test locally
NODE_ENV=production npm start
# Visit http://localhost:5000
```

## 2. Prepare for Vercel

1. **Generate `SESSION_SECRET`**:
   ```bash
   openssl rand -base64 32
   ```
   Save this value.

2. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

## 3. Deploy on Vercel

### Via Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Select your GitHub repository
4. **Framework Preset**: Leave as-is (auto-detected)
5. **Build Command**: Should be `npm run build`
6. **Output Directory**: Should be `dist`
7. Click **Deploy**

### Configure Environment Variables

After project is created, go to **Settings > Environment Variables** and add:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
SESSION_SECRET=<value from step 2.1>
NODE_ENV=production
```

Optional (Google OAuth):
```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
APP_BASE_URL=https://your-project.vercel.app
```

## 4. Redeploy

After setting env vars:
1. Go to **Deployments**
2. Click the failed/pending deployment
3. Click **Redeploy** (or push new commit to trigger)

## 5. Test

Once deployed:
- Visit your Vercel domain → should see login page
- Test `/api/auth/user` → should return 401 or user JSON
- Try register/login flow

## Troubleshooting

**Build fails**: Check GitHub Actions (`Actions` tab) for logs. Usually missing env vars at build time.

**Runtime error**: Check Vercel deployment logs (`Deployments` → select deployment → `Logs`).

**Database won't connect**: Ensure `DATABASE_URL` is correct and firewall allows Vercel IPs.

**Google OAuth doesn't work**: 
- Verify `APP_BASE_URL` matches your Vercel domain exactly
- Update Google OAuth callback URL in Google Cloud Console

## Further Reading

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for detailed instructions.
