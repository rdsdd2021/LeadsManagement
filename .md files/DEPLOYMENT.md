# Deploying to Vercel

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Push your code to GitHub
3. **Supabase Project** - Your Supabase project should be running

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ulhlebdgvrnwafahgzhz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsaGxlYmRndnJud2FmYWhnemh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDEwMTEsImV4cCI6MjA3NzU3NzAxMX0.3I27UOmUmxra1BQW36h4IeimBPzvfx8yFsOI5htX-1I
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsaGxlYmRndnJud2FmYWhnemh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAwMTAxMSwiZXhwIjoyMDc3NTc3MDExfQ.h4PkmWJ5eLGXNMvZaMhMreu4N9izy_F1NZVkZHuszHQ
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? (default or custom)
   - Directory? `./`
   - Override settings? **N**

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```
   
   Paste the values when prompted.

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Post-Deployment Configuration

### 1. Update Supabase Redirect URLs

Go to your Supabase Dashboard:
1. Navigate to **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Site URL**:
   ```
   https://your-app.vercel.app
   ```
3. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   ```

### 2. Configure CORS (if needed)

If you encounter CORS issues:
1. Go to Supabase Dashboard → **Settings** → **API**
2. Add your Vercel domain to allowed origins

### 3. Test Your Deployment

Visit your deployed app and test:
- ✅ Login functionality
- ✅ Lead management
- ✅ Filter operations
- ✅ Bulk operations
- ✅ User management
- ✅ Import functionality

## Troubleshooting

### Build Fails

**Error: Module not found**
```bash
# Locally, run:
npm install
npm run build
# Fix any errors, then redeploy
```

**Error: Environment variables missing**
- Double-check all 3 environment variables are set in Vercel
- Make sure there are no extra spaces or quotes

### Runtime Errors

**Error: Failed to fetch**
- Check Supabase URL is correct
- Verify Supabase project is running
- Check CORS settings in Supabase

**Error: Unauthorized**
- Verify SUPABASE_SERVICE_ROLE_KEY is set correctly
- Check user permissions in Supabase

### Performance Issues

**Slow initial load**
- This is normal for first visit (cold start)
- Subsequent visits will be faster
- Consider upgrading to Vercel Pro for better performance

**Database timeouts**
- Check Supabase connection pooling settings
- Verify database indexes are created (migrations applied)
- Consider upgrading Supabase plan if needed

## Monitoring

### Vercel Analytics

Enable analytics in Vercel Dashboard:
1. Go to your project
2. Click "Analytics" tab
3. Enable Web Analytics

### Logs

View deployment logs:
```bash
vercel logs
```

Or in Vercel Dashboard:
- Project → Deployments → Click deployment → View Logs

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase redirect URLs with new domain

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:
- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployment

## Environment Variables Management

To update environment variables:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Edit or add variables
3. Redeploy for changes to take effect

## Rollback

If something goes wrong:
1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs

---

## Quick Deploy Button

Add this to your README.md for one-click deployment:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)
