# Warbot.app - Complete Setup Guide

This guide will help you get Warbot.app up and running locally and in production.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [OCR Integration](#ocr-integration)
5. [Running the Application](#running-the-application)
6. [Deploying to Production](#deploying-to-production)
7. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites

Before you start, ensure you have:

- **Node.js**: Version 18.17 or higher
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`

- **npm or yarn**: Comes with Node.js
  - Verify: `npm --version`

- **Git**: For version control
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify: `git --version`

- **A Supabase account**: Free tier available at [supabase.com](https://supabase.com)

- **An Anthropic API account** (optional, for OCR): [console.anthropic.com](https://console.anthropic.com)

### Step 1: Clone the Repository

```bash
git clone https://github.com/fullstackslife/warbot-app.git
cd warbot-app
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Next.js 14
- React 18
- Supabase client libraries
- Anthropic SDK (for OCR)
- TypeScript and dev tools

### Step 3: Set Up Your Supabase Project

#### Create a new Supabase project:

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in the details:
   - Project name: `warbot-app` (or your choice)
   - Database password: Use a strong password (saved for later)
   - Region: Choose closest to your location
4. Click "Create new project"
5. Wait for it to initialize (2-5 minutes)

#### Get your credentials:

1. Go to **Project Settings** (bottom left gear icon)
2. Click **API** tab
3. You'll see:
   - **Project URL** (under "Project URL")
   - **Project Keys** section with:
     - **Anon key** (public key)
     - **Service role key** (secret - never expose)
4. Go to **Settings** → **Database**
5. Under "Connection string", copy the connection URL

### Step 4: Run Database Migrations

#### Option A: Using Supabase Dashboard (Recommended for first-time)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open `supabase/migrations/0001_init.sql` and copy its contents
4. Paste into the SQL Editor
5. Click **RUN**
6. Repeat for `supabase/migrations/0002_add_ocr_fields.sql`

#### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to your account
supabase login

# Link to your project
supabase link --project-id your_project_id

# Run migrations
supabase db push
```

## Environment Configuration

### Create .env.local file

In the root directory, create a file named `.env.local`:

```bash
touch .env.local
```

Or on Windows PowerShell:

```powershell
New-Item -Path .env.local -ItemType File
```

### Add your environment variables

Edit `.env.local` and add these variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DATABASE_URL=your_database_connection_string_here

# Anthropic API (optional - for OCR features)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=generate_a_random_secret_here
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

**macOS/Linux:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((Get-Random -InputObject ([byte[]] (1..32)) -Count 32))
```

Copy the output and add it to your `.env.local` file.

### Example completed .env.local:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yzmuyiuxfthptezgxpgo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
SUPABASE_DATABASE_URL=postgresql://postgres:password@db.yzmuyiuxfthptezgxpgo.supabase.co:5432/postgres
ANTHROPIC_API_KEY=sk-ant-v4-abc123...
NEXTAUTH_SECRET=nZpAjuQ0QOyOYEtjV8fnyanz7Ju3fzMoeUkpl6Y/+Fg=
```

## Database Setup

### Verify migrations were applied

1. Go to Supabase dashboard
2. Click **Table Editor**
3. You should see tables:
   - `profiles` - User profile information
   - `screenshots` - Uploaded screenshots metadata

### Check table structure

In the **SQL Editor**, run:

```sql
SELECT * FROM information_schema.tables WHERE table_schema = 'public';
```

You should see:
- `profiles`
- `screenshots`
- `profiles_with_data` (if migrations ran)

### Row Level Security (RLS)

Check that RLS is enabled:

```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
```

Both tables should have `rowsecurity = true`.

## OCR Integration

### Understanding OCR Processing

The app can automatically extract text from screenshots using Claude's Vision API:

1. When a screenshot is uploaded, it's marked as `processing_status = 'pending'`
2. Background processing triggers if `ANTHROPIC_API_KEY` is set
3. Claude analyzes the image and extracts readable text
4. Results are stored in the `extracted_text` column
5. Status changes to `'completed'` or `'failed'`

### Setting up OCR

#### 1. Get an Anthropic API key:

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API keys**
4. Click **Create key**
5. Copy the key (it starts with `sk-ant-`)
6. Add it to `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-v4-your-key-here
```

#### 2. Enable Claude 3.5 Sonnet model:

Ensure your account has access to the `claude-3-5-sonnet-20241022` model:

1. In Anthropic console, check **Models** section
2. The model should be available (free tier includes it)

#### 3. Test your OCR setup:

After starting the dev server, upload a screenshot in the dashboard. Check the server logs:

- If successful: "Text extraction completed"
- If API key missing: "ANTHROPIC_API_KEY not set - skipping text extraction"
- If error: Error message will be logged

### Optional: Disable OCR

To run without OCR, simply don't set `ANTHROPIC_API_KEY`. The app will still work, but text extraction will be skipped.

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts:
- Next.js dev server on `http://localhost:3000`
- Hot reload on file changes
- TypeScript type checking

Open your browser to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

Or run directly:

```bash
npm run build && npm run start
```

### Linting

Check for code issues:

```bash
npm run lint
```

## Deploying to Production

### Option 1: Vercel (Recommended)

Vercel is the recommended platform (created by Next.js team).

#### Prerequisites:

- GitHub account with your repository
- Vercel account (sign up at [vercel.com](https://vercel.com))

#### Deployment steps:

1. **Push to GitHub**:

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**:

   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

3. **Configure environment variables**:

   - Vercel shows "Environment Variables" section
   - Add all variables from your `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_DATABASE_URL`
     - `ANTHROPIC_API_KEY`
     - `NEXTAUTH_SECRET`
   - Click "Deploy"

4. **Your app is live!**

   - Vercel provides a URL like `your-app-name.vercel.app`
   - Each git push automatically triggers a new deploy

### Option 2: Docker

Create and deploy a Docker container.

#### Create Dockerfile in root directory:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

#### Build and run:

```bash
# Build image
docker build -t warbot-app .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  -e SUPABASE_DATABASE_URL=your_url \
  -e ANTHROPIC_API_KEY=your_key \
  -e NEXTAUTH_SECRET=your_secret \
  warbot-app
```

### Option 3: Self-Hosted (VPS/Server)

#### Install on Ubuntu/Debian:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Clone repository
cd /var/www
git clone https://github.com/youruser/warbot-app.git
cd warbot-app

# Install dependencies
npm install --production

# Create .env file
sudo nano .env.local
# Add your environment variables

# Build
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start app
pm2 start npm --name "warbot-app" -- start

# Configure to restart on reboot
pm2 startup
pm2 save
```

## Troubleshooting

### Common Issues and Solutions

#### "Cannot find module '@anthropic-ai/sdk'"

**Cause**: Dependencies not installed

**Solution**:
```bash
npm install
```

#### "NEXT_PUBLIC_SUPABASE_URL is missing"

**Cause**: `.env.local` not configured

**Solution**:
1. Create `.env.local` in root directory
2. Add all required environment variables
3. Restart the dev server: `npm run dev`

#### "Invalid login credentials"

**Cause**: Supabase auth not working

**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Check that your user exists in Supabase Auth
4. Look for errors in browser console (F12)

#### "Storage error: permission denied"

**Cause**: RLS policies not configured

**Solution**:
1. Go to Supabase Storage
2. Click "screenshots" bucket
3. Go to "Policies" tab
4. Ensure three policies exist:
   - "Authenticated users can read"
   - "Users can upload"
   - "Users can delete their own"

#### "Screenshots not appearing in gallery"

**Cause**: Multiple possible causes

**Solution**:
1. Check browser console (F12) for errors
2. Verify RLS policies are correct
3. Check file_path is stored in database
4. Try generating new signed URLs:
   ```sql
   SELECT * FROM public.screenshots LIMIT 10;
   ```

#### "Failed to extract text from screenshot"

**Cause**: OCR API issue

**Solution**:
1. Verify `ANTHROPIC_API_KEY` is set correctly
2. Check API key is valid in [console.anthropic.com](https://console.anthropic.com)
3. Ensure account has credits/quota
4. Check server logs for error details
5. Try uploading a different image format

#### "Database connection failed"

**Cause**: Invalid connection string

**Solution**:
1. Go to Supabase dashboard
2. Check **Settings** → **Database**
3. Copy the connection string again
4. Paste into `SUPABASE_DATABASE_URL`
5. Ensure username and password are URL-encoded

### Getting Help

If you encounter issues:

1. **Check the logs**:
   - Browser console: Press F12
   - Server logs: Terminal where `npm run dev` runs
   - Supabase: Dashboard → Logs

2. **Search GitHub issues**: Check if someone had the same problem

3. **Enable debug mode**: Add to top of `.env.local`:
   ```env
   DEBUG=* 
   ```

4. **Check database directly**:
   - Go to Supabase SQL Editor
   - Run: `SELECT * FROM public.profiles;`
   - Run: `SELECT * FROM public.screenshots;`

## Next Steps

After setup is complete:

1. **Create your first account**: Go to `/signup`
2. **Upload a screenshot**: Go to `/dashboard` and upload
3. **View the gallery**: Go to `/gallery` to see all uploads
4. **Invite guild members**: Share your app URL with them

## Security Notes

- **Never commit `.env.local`**: It's already in `.gitignore`
- **Rotate API keys**: Regularly update Supabase keys
- **Use strong passwords**: For Supabase and Anthropic accounts
- **Monitor usage**: Check Anthropic API usage in console
- **Enable 2FA**: On GitHub, Supabase, and Anthropic accounts

## Support

For issues or questions:
- Check the README.md for feature documentation
- Review COPILOT_INSTRUCTIONS.md for development guidelines
- Check browser console and server logs for error messages

Happy scouting! 🎮
