# Deployment Guide

## Railway Deployment

### Prerequisites
- Railway account (https://railway.app)
- Railway CLI installed: `npm install -g @railway/cli`

### Backend Repository

The backend code is available at:
**https://github.com/504naldo/ewf-emergency-call-backend**

### Step 1: Deploy Backend from GitHub

**Option A: Deploy via Railway Dashboard (Recommended)**

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select `504naldo/ewf-emergency-call-backend`
4. Railway will automatically detect the configuration and deploy

**Option B: Deploy via CLI**

```bash
# Clone the repository
git clone https://github.com/504naldo/ewf-emergency-call-backend.git
cd ewf-emergency-call-backend

# Login to Railway
railway login

# Initialize and deploy
railway init
railway up
```

### Step 2: Add MySQL Database

1. Go to Railway dashboard
2. Click "+ New" → "Database" → "Add MySQL"
3. Railway will automatically set `DATABASE_URL` environment variable

### Step 3: Set Environment Variables

In Railway dashboard, add these environment variables:

```
NODE_ENV=production
DATABASE_URL=(automatically set by Railway MySQL)
JWT_SECRET=(generate with: openssl rand -base64 32)
BUILT_IN_FORGE_API_URL=(Manus API URL)
BUILT_IN_FORGE_API_KEY=(Manus API key)
```

### Step 4: Run Database Migrations

```bash
# After first deployment, run migrations
railway run pnpm db:push
```

### Step 5: Get Production URL

```bash
# Get your Railway deployment URL
railway domain
```

The URL will be something like: `https://ewf-emergency-call-production.up.railway.app`

### Step 6: Update Mobile App

Update `eas.json` with your production URL:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-app.up.railway.app"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-app.up.railway.app"
      }
    }
  }
}
```

### Step 7: Rebuild Mobile App

```bash
# Android APK
EXPO_TOKEN=your_token npx eas-cli build --platform android --profile preview --non-interactive

# iOS TestFlight
EXPO_TOKEN=your_token npx eas-cli build --platform ios --profile preview --non-interactive
```

## Health Check

After deployment, verify the API is working:

```bash
curl https://your-app.up.railway.app/api/trpc/health.check
```

Expected response:
```json
{
  "result": {
    "data": {
      "json": {
        "status": "healthy",
        "database": "connected",
        "timestamp": "2026-02-07T18:00:00.000Z"
      }
    }
  }
}
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is set in Railway dashboard
- Check database is running in Railway
- Run migrations: `railway run pnpm db:push`

### Build Failures
- Check Railway build logs
- Verify all dependencies are in `package.json`
- Ensure `pnpm build` works locally

### API Not Responding
- Check Railway deployment logs
- Verify health endpoint: `/api/trpc/health.check`
- Check environment variables are set correctly

## Alternative: Render Deployment

If you prefer Render over Railway:

1. Create new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pnpm install && pnpm build`
4. Set start command: `pnpm start`
5. Add MySQL database (or use external provider like PlanetScale)
6. Set environment variables
7. Deploy

## Cost Estimates

- **Railway**: ~$5-10/month (includes database)
- **Render**: ~$7/month for web service + database costs
- **PlanetScale** (database): Free tier available, $29/month for production

## Security Notes

- Never commit `.env` files
- Rotate JWT_SECRET regularly
- Use strong database passwords
- Enable HTTPS only (Railway/Render provide this by default)
- Set up CORS properly in production
