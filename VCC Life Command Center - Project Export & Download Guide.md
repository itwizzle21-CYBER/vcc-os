# VCC Life Command Center - Project Export & Download Guide

## Complete Project Download

### Option 1: Download from Manus Management UI (Easiest)

1. **Open VCC Project** in Manus
2. **Click Management UI** (top-right panel icon)
3. **Go to Code Panel** → Click **More** (⋯) → **Download as ZIP**
4. **Extract ZIP** to your desired location
5. **Done!** You have the complete project

### Option 2: Clone from GitHub (If Already Exported)

```bash
git clone git@github.com:{your-username}/vcc-command-center.git
cd vcc-command-center
```

---

## Quick Start After Download

### Prerequisites

- **Node.js 18+**: Check with `node --version`
- **pnpm 10+**: Install with `npm install -g pnpm`
- **MySQL 8.0+**: Local or remote database
- **Git**: For version control

### Initial Setup (5 minutes)

```bash
# 1. Navigate to project
cd vcc-command-center

# 2. Install dependencies
pnpm install

# 3. Create environment file
cp .env.example .env.local

# 4. Edit .env.local with your database credentials
# DATABASE_URL=mysql://user:password@localhost:3306/vcc
nano .env.local

# 5. Run database migrations
pnpm drizzle-kit migrate

# 6. Start development server
pnpm dev

# 7. Open browser to http://localhost:3000
```

### Available Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm dev:debug       # Start with debugging

# Production
pnpm build           # Build for production
pnpm start           # Run production build
pnpm preview         # Preview production build

# Testing
pnpm test            # Run all tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Generate coverage report

# Code Quality
pnpm format          # Format code with Prettier
pnpm check           # Type check with TypeScript
pnpm lint            # Lint code (if configured)

# Database
pnpm drizzle-kit generate  # Generate migrations
pnpm drizzle-kit migrate   # Apply migrations
pnpm drizzle-kit studio    # Open Drizzle Studio (visual DB editor)
```

---

## Project Structure

```
vcc-command-center/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   ├── components/             # Reusable UI components
│   │   ├── modules/                # Feature modules
│   │   │   ├── bills/              # Bills module
│   │   │   ├── debt/               # Debt module
│   │   │   ├── savings/            # Savings module
│   │   │   ├── inventory/          # Inventory module
│   │   │   └── loader.ts           # Module registration
│   │   ├── lib/trpc.ts             # tRPC client
│   │   ├── App.tsx                 # Main app component
│   │   └── index.css               # Global styles
│   ├── index.html                  # HTML entry point
│   └── public/                     # Static assets
├── server/                          # Express backend
│   ├── modules/                    # Feature modules
│   │   ├── bills/                  # Bills backend
│   │   ├── debt/                   # Debt backend
│   │   ├── savings/                # Savings backend
│   │   ├── inventory/              # Inventory backend
│   │   ├── dashboard/              # Dashboard data
│   │   └── registry.ts             # Module registry
│   ├── _core/                      # Core infrastructure
│   │   ├── index.ts                # Express server
│   │   ├── trpc.ts                 # tRPC setup
│   │   ├── context.ts              # Request context
│   │   ├── oauth.ts                # OAuth integration
│   │   └── moduleLoader.ts         # Module loading
│   ├── db.ts                       # Database helpers
│   ├── routers.ts                  # Main router
│   └── storage.ts                  # S3 storage
├── drizzle/                        # Database schema
│   ├── schema.ts                   # Table definitions
│   ├── migrations/                 # Migration files
│   └── relations.ts                # Table relationships
├── shared/                         # Shared code
│   ├── const.ts                    # Constants
│   └── types.ts                    # Shared types
├── SYSTEM_DOCUMENTATION.md         # Complete system docs
├── GITHUB_EXPORT_GUIDE.md          # GitHub export guide
├── MODULE_CREATION_GUIDE.md        # How to add modules
├── ARCHITECTURE.md                 # Architecture overview
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite config
├── vitest.config.ts                # Test config
└── drizzle.config.ts               # Database config
```

---

## Database Setup

### Local MySQL (Development)

```bash
# Install MySQL (macOS with Homebrew)
brew install mysql

# Start MySQL
brew services start mysql

# Create database
mysql -u root -e "CREATE DATABASE vcc;"

# Set environment variable
export DATABASE_URL="mysql://root:@localhost:3306/vcc"

# Run migrations
pnpm drizzle-kit migrate
```

### Remote Database (Production)

```bash
# Use managed database service
# Examples: AWS RDS, DigitalOcean, PlanetScale, Supabase

# Set environment variable
export DATABASE_URL="mysql://user:password@host:port/database"

# Run migrations
pnpm drizzle-kit migrate
```

### Drizzle Studio (Visual DB Editor)

```bash
# Open visual database editor
pnpm drizzle-kit studio

# Opens at http://local.drizzle.studio
# Browse tables, view data, run queries
```

---

## GitHub Export & Version Control

### Export to GitHub (One-Time Setup)

**Using Manus Management UI:**
1. Go to Management UI → **More** (⋯) → **GitHub**
2. Select GitHub owner and repository name
3. Click **Export**
4. Manus creates repo and pushes code

**Manual Setup:**
```bash
git init
git add .
git commit -m "Initial commit: VCC Life Command Center"
git remote add origin git@github.com:{username}/vcc-command-center.git
git branch -M main
git push -u origin main
```

### Ongoing Development

```bash
# Check status
git status

# Stage changes
git add .

# Commit changes
git commit -m "feat: Add new feature"

# Push to GitHub
git push origin main

# View history
git log --oneline
```

---

## Deployment Options

### Option 1: Manus Hosting (Recommended)

**Pros**: Automatic deployments, custom domains, zero config  
**Steps**:
1. In Manus Management UI, click **Publish**
2. Choose domain (auto-generated or custom)
3. Click **Deploy**
4. Access your app at provided URL

### Option 2: Railway (Recommended for External Hosting)

**Pros**: Simple setup, free tier, good performance

```bash
# 1. Create Railway account at railway.app
# 2. Connect GitHub repository
# 3. Railway auto-detects Node.js project
# 4. Set environment variables in Railway dashboard
# 5. Deploy automatically on git push
```

**Environment Variables to Set:**
```
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=your-secret-key
NODE_ENV=production
```

### Option 3: Render

**Pros**: Free tier, easy setup

```bash
# 1. Create Render account at render.com
# 2. Create new Web Service
# 3. Connect GitHub repository
# 4. Configure build command: pnpm install && pnpm build
# 5. Configure start command: pnpm start
# 6. Set environment variables
# 7. Deploy
```

### Option 4: Docker (Advanced)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

```bash
# Build and run
docker build -t vcc-command-center .
docker run -p 3000:3000 -e DATABASE_URL="..." vcc-command-center
```

---

## Environment Variables

### Development (.env.local)

```bash
# Database
DATABASE_URL=mysql://root:@localhost:3306/vcc

# OAuth (Manus)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# JWT
JWT_SECRET=dev-secret-key-change-in-production

# Owner Info
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name

# APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im/v1
BUILT_IN_FORGE_API_KEY=your-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/v1
VITE_FRONTEND_FORGE_API_KEY=your-key

# App
VITE_APP_TITLE=VCC Command Center
VITE_APP_LOGO=https://your-logo-url.png

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-id
```

### Production

Set these in your hosting platform's environment variables:

```
DATABASE_URL=mysql://prod-user:prod-pass@prod-host/vcc_prod
JWT_SECRET=production-jwt-secret-key-32-chars-min
VITE_APP_ID=production-app-id
NODE_ENV=production
```

---

## Testing

### Run All Tests

```bash
pnpm test
```

### Run Specific Test File

```bash
pnpm test bills.test.ts
```

### Watch Mode (Auto-rerun on changes)

```bash
pnpm test:watch
```

### Coverage Report

```bash
pnpm test:coverage
```

### Example Test Output

```
✓ Bills Module (10 tests)
  ✓ should create bill
  ✓ should update bill
  ✓ should delete bill
  ✓ should mark as paid
  ✓ should get upcoming bills
  ...

✓ Debt Module (10 tests)
✓ Savings Module (12 tests)
✓ Inventory Module (8 tests)

Pass: 40 tests
```

---

## Troubleshooting

### "Cannot find module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Database connection fails

```bash
# Check DATABASE_URL format
# Should be: mysql://user:password@host:port/database

# Test connection
mysql -u user -p -h host -D database

# Check .env.local is loaded
echo $DATABASE_URL
```

### Port 3000 already in use

```bash
# Use different port
PORT=3001 pnpm dev

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### TypeScript errors

```bash
# Type check
pnpm check

# Fix errors in code, then retry
```

### Dashboard not loading

```bash
# Check browser console for errors
# Open DevTools: F12 or Cmd+Option+I

# Check server logs
# Look for [Error] messages in terminal

# Verify database is running
# Check DATABASE_URL is correct
```

---

## Performance Tips

### Development

- Use `pnpm dev` for hot module reloading
- Keep browser DevTools open to monitor network
- Use `pnpm test:watch` for TDD workflow

### Production

- Run `pnpm build` to optimize bundle
- Enable gzip compression on server
- Use CDN for static assets
- Monitor database query performance
- Set up error tracking (Sentry, etc.)

---

## Backup & Recovery

### Backup Database

```bash
# Export database
mysqldump -u user -p database > backup.sql

# Compress backup
gzip backup.sql
```

### Restore Database

```bash
# Decompress backup
gunzip backup.sql.gz

# Import database
mysql -u user -p database < backup.sql
```

### Backup Code

```bash
# GitHub is your backup
# But also keep local copy

# Create local backup
cp -r vcc-command-center vcc-command-center-backup-2026-06-10
```

---

## Security Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to strong random value
- [ ] Set DATABASE_URL to production database
- [ ] Enable HTTPS (automatic on Manus/Railway/Render)
- [ ] Review environment variables (no secrets in code)
- [ ] Enable database SSL/TLS
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Review CORS settings
- [ ] Set up monitoring & alerts
- [ ] Enable database backups

---

## Getting Help

### Documentation

- **System Documentation**: `SYSTEM_DOCUMENTATION.md`
- **GitHub Export Guide**: `GITHUB_EXPORT_GUIDE.md`
- **Module Creation Guide**: `MODULE_CREATION_GUIDE.md`
- **Architecture**: `ARCHITECTURE.md`

### Resources

- **tRPC Docs**: https://trpc.io
- **Drizzle ORM**: https://orm.drizzle.team
- **React Docs**: https://react.dev
- **Express Docs**: https://expressjs.com
- **Tailwind CSS**: https://tailwindcss.com

### Troubleshooting

1. Check documentation files above
2. Review error messages in browser console
3. Check server logs in terminal
4. Review database with Drizzle Studio
5. Search GitHub issues for similar problems

---

## Next Steps

1. **Download Project**: Use Option 1 above
2. **Setup Locally**: Follow Quick Start section
3. **Explore Modules**: Check out Bills, Debt, Savings, Inventory
4. **Read Documentation**: Review SYSTEM_DOCUMENTATION.md
5. **Add Custom Modules**: Follow MODULE_CREATION_GUIDE.md
6. **Deploy**: Choose deployment option and follow steps
7. **Monitor**: Set up logging and error tracking

---

**Last Updated**: June 2026  
**Version**: 1.0.0  
**Status**: Production Ready
