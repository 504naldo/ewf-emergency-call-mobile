# Railway Post-Deployment Setup Guide

After your Railway service reaches **Running / Healthy** status, follow these steps to add the database and run migrations.

## Prerequisites

- Railway service is deployed and showing **Healthy** status
- You have access to the Railway dashboard
- Railway CLI installed: `npm install -g @railway/cli`

## Step 1: Verify Service is Healthy

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Click on your `ewf-emergency-call-backend` service
3. Check that the status shows **Running** with a green checkmark
4. Click on "Deployments" tab and verify latest deployment is **Success**

The health endpoint should be accessible at your Railway URL:
```bash
curl https://your-service.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1770490000000
}
```

## Step 2: Add MySQL Database

1. In Railway dashboard, click "+ New" in the top right
2. Select "Database" → "Add MySQL"
3. Railway will create a MySQL instance and automatically set `DATABASE_URL` environment variable
4. Wait for the database to finish provisioning (~30 seconds)

**Important**: The `DATABASE_URL` is automatically injected into your service's environment. No manual configuration needed!

## Step 3: Run Database Migrations

### Option A: Via Railway CLI (Recommended)

```bash
# Login to Railway (if not already logged in)
railway login

# Link to your project
cd /path/to/ewf-emergency-call-backend
railway link

# Run migrations
railway run pnpm db:push
```

### Option B: Via Railway Dashboard

1. Go to your service in Railway dashboard
2. Click on "Settings" tab
3. Scroll to "Service" section
4. Click "New Deployment" → "Run Command"
5. Enter command: `pnpm db:push`
6. Click "Run"

The migration will:
- Create all required tables (users, incidents, incident_events, call_attempts, sites, etc.)
- Set up indexes and foreign keys
- Initialize the schema

## Step 4: Seed Initial Data (Optional)

If you need to add demo users or initial configuration:

```bash
# Via Railway CLI
railway run node dist/add-passwords.js

# Or connect to your database and run SQL manually
railway connect mysql
```

Example SQL to create an admin user:
```sql
INSERT INTO users (openId, name, email, role, active, available, phone, password) 
VALUES (
  'admin-001',
  'Admin User',
  'admin@ewandf.ca',
  'admin',
  1,
  1,
  '+1234567890',
  '$2b$10$...' -- Use bcrypt to hash password
);
```

## Step 5: Set Additional Environment Variables

In Railway dashboard → Settings → Variables, add:

```
JWT_SECRET=<generate with: openssl rand -base64 32>
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<your-manus-api-key>
```

**To generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

After adding variables, Railway will automatically redeploy your service.

## Step 6: Test the API

### Test Health Endpoint
```bash
curl https://your-service.up.railway.app/health
```

### Test Login Endpoint
```bash
curl -X POST https://your-service.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ewandf.ca",
    "password": "your-password"
  }'
```

Expected response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@ewandf.ca",
    "role": "admin",
    ...
  }
}
```

### Test tRPC Health Check
```bash
curl https://your-service.up.railway.app/api/trpc/health.check
```

## Step 7: Update Mobile App Configuration

1. Copy your Railway service URL (e.g., `https://ewf-emergency-call-backend-production.up.railway.app`)

2. Update `eas.json` in your mobile app project:
```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-service.up.railway.app"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-service.up.railway.app"
      }
    }
  }
}
```

3. Rebuild your mobile app:
```bash
EXPO_TOKEN=your_token npx eas-cli build --platform android --profile preview --non-interactive
```

## Troubleshooting

### Service Not Healthy

If the service shows "Unhealthy" or "Crashed":

1. Check deployment logs in Railway dashboard
2. Verify the service is binding to `0.0.0.0` (not `localhost`)
3. Verify the health endpoint returns 200 OK
4. Check that `PORT` environment variable is being used

### Database Connection Errors

If you see database connection errors:

1. Verify MySQL database is provisioned and running
2. Check that `DATABASE_URL` is set in environment variables
3. Ensure the database is in the same Railway project
4. Try redeploying the service after database is ready

### Migration Failures

If `pnpm db:push` fails:

1. Check that `DATABASE_URL` is accessible
2. Verify the database is empty (no conflicting tables)
3. Check Railway logs for specific error messages
4. Try running migrations locally first to verify they work

### API Returns 500 Errors

1. Check Railway deployment logs for error details
2. Verify all required environment variables are set
3. Ensure database migrations have been run
4. Test the health endpoint to verify service is running

## Monitoring

### Set Up Health Monitoring

Use a service like UptimeRobot to monitor your API:

1. Sign up at https://uptimerobot.com
2. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://your-service.up.railway.app/health`
   - Interval: 5 minutes
3. Set up email/SMS alerts for downtime

### View Logs

In Railway dashboard:
- Click on your service
- Go to "Deployments" tab
- Click on a deployment to view logs
- Use the search/filter to find specific errors

### Database Metrics

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network traffic
- Database connections

Access these in the "Metrics" tab of your service.

## Cost Optimization

Railway pricing (as of 2026):
- **Hobby Plan**: $5/month for 500 hours of service runtime
- **Pro Plan**: $20/month for unlimited runtime
- **Database**: Included in plan, scales with usage

To optimize costs:
1. Use the Hobby plan for testing/staging
2. Upgrade to Pro for production
3. Monitor resource usage in Railway dashboard
4. Set up spending limits if needed

## Next Steps

Once your Railway service is healthy and the database is set up:

1. ✅ Test all API endpoints
2. ✅ Update mobile app with production URL
3. ✅ Rebuild and distribute mobile app
4. ✅ Set up monitoring and alerts
5. ✅ Configure backups (Railway provides automatic backups)
6. ✅ Document your production URL for team members

## Support

For Railway-specific issues:
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Support: https://railway.app/help

For app-specific issues:
- Check the main README.md
- Review server logs in Railway dashboard
- Contact: support@ewandf.ca
