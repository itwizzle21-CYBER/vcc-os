# VCC Life Command Center - GitHub Export & Deployment Guide

## Quick Start: Export to GitHub

### Option 1: Using Manus Management UI (Recommended)

This is the easiest method and is built into the Manus platform.

#### Step 1: Access Management UI

1. Open your VCC project in Manus
2. Click the **Management UI** button (top-right corner, looks like a panel icon)
3. The right sidebar will open with multiple tabs

#### Step 2: Navigate to GitHub Integration

1. In the Management UI sidebar, click the **More** menu (⋯ button in the top-right)
2. Select **GitHub** from the dropdown menu

#### Step 3: Configure GitHub Export

1. **Select GitHub Owner**: Choose your personal account or organization
2. **Repository Name**: Enter `vcc-command-center` (or your preferred name)
3. **Repository Visibility**: Choose "Private" (recommended for personal finance app)
4. **Branch**: Defaults to `main` (recommended)

#### Step 4: Complete Export

1. Click **Export to GitHub**
2. Manus will create the repository and push all code
3. You'll receive a confirmation with the repository URL

#### Step 5: Verify Export

```bash
# Clone the repository
git clone git@github.com:{your-username}/vcc-command-center.git
cd vcc-command-center

# Verify code is present
ls -la
git log --oneline | head -10
```

---

### Option 2: Manual Git Setup (Advanced)

If you prefer to manage the repository manually:

#### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `vcc-command-center`
3. **Description**: "Personal Finance & Life Management Dashboard"
4. **Visibility**: Private (recommended)
5. **Initialize repository**: Leave unchecked (we'll push existing code)
6. Click **Create repository**

#### Step 2: Export Project Files from Manus

1. In Manus Management UI, go to **Code** panel
2. Click **Download as ZIP**
3. Extract the ZIP file to a local directory

#### Step 3: Initialize Git Repository

```bash
cd /path/to/vcc-command-center

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: VCC Life Command Center foundation"

# Add remote repository
git remote add origin git@github.com:{your-username}/vcc-command-center.git

# Push to GitHub
git branch -M main
git push -u origin main
```

#### Step 4: Verify Repository

Visit `https://github.com/{your-username}/vcc-command-center` to confirm all files are present.

---

## Deployment Options

### Option 1: Manus Hosting (Recommended)

**Pros**: Automatic deployments, custom domains, zero configuration  
**Cons**: Limited to Manus infrastructure

#### Steps

1. In Manus Management UI, click **Publish** (top-right)
2. Choose deployment settings:
   - **Domain**: Use auto-generated `vcc-command-center.manus.space` or custom domain
   - **Environment**: Production
3. Click **Deploy**
4. Wait for deployment to complete (~2 minutes)
5. Access your app at the provided URL

### Option 2: Railway (Recommended for External Hosting)

**Pros**: Simple deployment, free tier available, good performance  
**Cons**: Requires external account

#### Prerequisites

- Railway account (free at [railway.app](https://railway.app))
- GitHub repository pushed

#### Steps

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `vcc-command-center` repository
4. Railway will auto-detect Node.js project
5. Configure environment variables:
   ```
   DATABASE_URL=mysql://user:pass@host/db
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```
6. Click **Deploy**
7. Access your app at the provided Railway domain

### Option 3: Render (Alternative)

**Pros**: Free tier, easy setup, good documentation  
**Cons**: Slower cold starts on free tier

#### Steps

1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect GitHub repository
4. Select `vcc-command-center`
5. Configure:
   - **Name**: `vcc-command-center`
   - **Environment**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
6. Add environment variables (same as Railway)
7. Click **Create Web Service**

### Option 4: Vercel (Frontend Only)

**Pros**: Optimized for React, fastest deployments  
**Cons**: Requires backend hosted elsewhere

#### Steps

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New...** → **Project**
3. Import GitHub repository
4. Select `vcc-command-center`
5. Configure:
   - **Framework**: Vite
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
6. Add environment variables for backend API
7. Click **Deploy**

---

## Environment Variables

### Development (.env.local)

```bash
# Database
DATABASE_URL=mysql://root:password@localhost:3306/vcc

# OAuth
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# JWT
JWT_SECRET=your-jwt-secret-key-here

# Owner Info
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im/v1
BUILT_IN_FORGE_API_KEY=your-forge-api-key

# Frontend
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/v1
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-key
VITE_APP_TITLE=VCC Command Center
VITE_APP_LOGO=https://your-logo-url.png

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### Production (Environment Variables)

Set these in your hosting platform's environment variables section:

```
DATABASE_URL=mysql://prod-user:prod-password@prod-host:3306/vcc_prod
JWT_SECRET=production-jwt-secret-key
VITE_APP_ID=production-app-id
NODE_ENV=production
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+ (check with `node --version`)
- pnpm 10+ (install with `npm install -g pnpm`)
- MySQL 8.0+ (or use Docker)
- Git

### Initial Setup

```bash
# Clone repository
git clone git@github.com:{your-username}/vcc-command-center.git
cd vcc-command-center

# Install dependencies
pnpm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local with your database credentials
nano .env.local

# Run database migrations
pnpm drizzle-kit migrate

# Start development server
pnpm dev
```

### Available Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)
pnpm dev:debug       # Start with debugging

# Building
pnpm build           # Build for production
pnpm preview         # Preview production build

# Testing
pnpm test            # Run all tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Generate coverage report

# Code Quality
pnpm format          # Format code with Prettier
pnpm check           # Type check with TypeScript
pnpm lint            # Lint code

# Database
pnpm drizzle-kit generate  # Generate migrations
pnpm drizzle-kit migrate   # Apply migrations
pnpm drizzle-kit studio    # Open Drizzle Studio
```

---

## Continuous Integration / Continuous Deployment (CI/CD)

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Type check
        run: pnpm check

      - name: Build
        run: pnpm build

      - name: Deploy to Manus
        env:
          MANUS_API_KEY: ${{ secrets.MANUS_API_KEY }}
        run: |
          # Deploy command here
```

### Setting Up Secrets

1. Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add secrets:
   - `MANUS_API_KEY`: Your Manus API key
   - `DATABASE_URL`: Production database URL
   - `JWT_SECRET`: Production JWT secret

---

## Monitoring & Debugging

### Logs

#### Manus Hosting
```bash
# In Manus Management UI → Dashboard → Logs
# View real-time server logs
```

#### Railway
```bash
# In Railway dashboard → Logs tab
# View deployment and runtime logs
```

#### Local Development
```bash
# Server logs appear in terminal
# Client logs appear in browser console
# Database logs: `tail -f .manus-logs/devserver.log`
```

### Performance Monitoring

1. **Frontend Performance**:
   - Open browser DevTools → Performance tab
   - Record page load
   - Analyze metrics

2. **Backend Performance**:
   - Check tRPC response times in Network tab
   - Monitor database query times
   - Use `console.time()` for profiling

3. **Database Performance**:
   - Use Drizzle Studio: `pnpm drizzle-kit studio`
   - Monitor slow queries
   - Check indexes

---

## Troubleshooting

### Deployment Issues

**Problem**: Build fails with "Module not found"
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

**Problem**: Database connection fails
```bash
# Solution: Verify DATABASE_URL format
# Should be: mysql://user:password@host:port/database
# Check credentials and network access
```

**Problem**: Environment variables not loading
```bash
# Solution: Restart dev server
# Ctrl+C to stop
# pnpm dev to restart
# Variables should now load
```

### Runtime Issues

**Problem**: "Cannot find module" errors
```bash
# Solution: Check imports are correct
# Use absolute paths: @/components/...
# Not relative: ../../../components/...
```

**Problem**: tRPC queries not working
```bash
# Solution: Check browser console for errors
# Verify backend is running
# Check database connection
```

**Problem**: Dashboard not loading
```bash
# Solution: Check if all modules are registered
# Verify module exports in loader.ts
# Check browser console for errors
```

---

## Security Best Practices

### Before Deploying

- [ ] Change all default credentials
- [ ] Set strong JWT_SECRET (use `openssl rand -base64 32`)
- [ ] Enable HTTPS (automatic on Manus/Railway/Render)
- [ ] Set DATABASE_URL to production database
- [ ] Review environment variables (no secrets in code)
- [ ] Enable database SSL/TLS
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Review CORS settings

### Ongoing Security

- [ ] Keep dependencies updated: `pnpm update`
- [ ] Monitor for vulnerabilities: `pnpm audit`
- [ ] Review access logs regularly
- [ ] Rotate JWT_SECRET periodically
- [ ] Backup database regularly
- [ ] Monitor for unusual activity
- [ ] Keep Node.js updated

---

## Rollback Procedure

### If Deployment Goes Wrong

#### Manus Hosting
1. Go to Management UI → **Dashboard** → **Version history**
2. Find the previous working version
3. Click **Rollback**
4. Confirm rollback

#### External Hosting (Railway/Render)
```bash
# View deployment history
git log --oneline | head -10

# Rollback to previous commit
git revert {commit-hash}
git push origin main

# Hosting platform will auto-redeploy
```

---

## Support & Resources

- **Manus Documentation**: https://docs.manus.im
- **tRPC Documentation**: https://trpc.io
- **Drizzle ORM**: https://orm.drizzle.team
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs

---

**Last Updated:** June 2026  
**Version:** 1.0.0
