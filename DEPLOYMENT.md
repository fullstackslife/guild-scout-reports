# Deployment Guide

Complete instructions for deploying Warbot.app to production.

## Overview

Warbot.app can be deployed to multiple platforms:

1. **Vercel** ⭐ Recommended - Easiest setup
2. **Docker** - For any platform (AWS, GCP, Azure, Digital Ocean)
3. **Self-Hosted** - VPS or dedicated server
4. **Serverless** - AWS Lambda, Google Cloud Functions

## Deployment Checklist

Before deploying anywhere, complete this checklist:

- [ ] All environment variables configured
- [ ] Database migrations applied to production DB
- [ ] RLS policies enabled and tested
- [ ] Storage bucket policies configured
- [ ] API keys generated (separate keys for prod)
- [ ] Secrets stored securely (never in git)
- [ ] Backups configured for database
- [ ] Error logging set up
- [ ] Tests pass locally
- [ ] Build completes without errors
- [ ] No sensitive data in code or commits

## Option 1: Vercel (Recommended)

### Why Vercel?

- Built by Next.js creators
- Automatic deployments on git push
- Serverless functions
- Zero configuration for Next.js
- Free tier available
- Easy environment variable management

### Prerequisites

- GitHub account with your code pushed
- Vercel account (free at [vercel.com](https://vercel.com))

### Step-by-Step

#### 1. Push to GitHub

```bash
git add .
git commit -m "Initial production deployment"
git push origin main
```

#### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Authorize GitHub access
4. Select `warbot-app` repository
5. Click "Import"

#### 3. Configure Environment Variables

In the "Environment Variables" section, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_DATABASE_URL=postgresql://postgres:pass@db.supabase.co:5432/postgres
ANTHROPIC_API_KEY=sk-ant-v4-...
NEXTAUTH_SECRET=your-secret-here
```

**Important Notes:**
- `NEXT_PUBLIC_*` variables are safe to expose
- Other variables are kept secret
- Use production Supabase project credentials
- Use production Anthropic API key

#### 4. Deploy

1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. You'll get a URL like `warbot-app.vercel.app`

#### 5. Post-Deployment

1. **Run database migrations** (if not done):
   - Go to Supabase dashboard
   - Run migration files in SQL Editor
   - Or use `supabase db push --remote`

2. **Test your deployment**:
   - Visit your URL
   - Create a test account
   - Upload a test screenshot
   - Verify gallery shows it

3. **Set up custom domain** (optional):
   - In Vercel project settings
   - Add your custom domain
   - Update DNS records

### Automatic Deployments

After this setup:
- Every git push to `main` automatically deploys
- Preview URLs for pull requests
- Easy rollbacks if needed

### Monitoring

In Vercel dashboard:
- View build logs
- Check function performance
- Monitor errors and analytics
- View serverless function usage

## Option 2: Docker

### Why Docker?

- Works on any platform
- Reproducible environments
- Easy to scale
- Cloud-native

### Prerequisites

- Docker installed locally
- Docker Hub account (free at [hub.docker.com](https://hub.docker.com))
- Server with Docker installed (AWS EC2, Digital Ocean, etc.)

### Step 1: Build Locally

Create `Dockerfile` in root (already documented in SETUP.md):

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

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

### Step 2: Build Image

```bash
docker build -t warbot-app:latest .
```

### Step 3: Test Locally

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  -e SUPABASE_DATABASE_URL=your_db_url \
  -e ANTHROPIC_API_KEY=your_key \
  -e NEXTAUTH_SECRET=your_secret \
  warbot-app:latest
```

Visit [http://localhost:3000](http://localhost:3000)

### Step 4: Push to Docker Hub

```bash
# Login
docker login

# Tag image
docker tag warbot-app:latest yourusername/warbot-app:latest

# Push
docker push yourusername/warbot-app:latest
```

### Step 5: Deploy to Server

#### On your server:

```bash
docker pull yourusername/warbot-app:latest

docker run -d \
  --name warbot-app \
  -p 80:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  -e SUPABASE_DATABASE_URL=your_db_url \
  -e ANTHROPIC_API_KEY=your_key \
  -e NEXTAUTH_SECRET=your_secret \
  yourusername/warbot-app:latest
```

Your app is now running on port 80!

### Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: yourusername/warbot-app:latest
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      SUPABASE_DATABASE_URL: ${SUPABASE_DATABASE_URL}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d
```

## Option 3: Self-Hosted (VPS)

### Why Self-Host?

- Full control
- No vendor lock-in
- Potential cost savings at scale
- Custom configurations

### Prerequisites

- VPS with Ubuntu 20.04+ or Debian 11+
- SSH access
- Domain name (optional)
- ~2GB RAM, 1 vCPU minimum

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs npm

# Install Git
sudo apt install -y git

# Create app directory
sudo mkdir -p /var/www/warbot-app
cd /var/www/warbot-app
```

### Step 2: Clone and Setup

```bash
# Clone repository
sudo git clone https://github.com/youruser/warbot-app.git .

# Install dependencies
sudo npm install --production

# Create .env file
sudo nano .env.local
```

Add environment variables, save (Ctrl+X, Y, Enter)

### Step 3: Build and Configure

```bash
# Build app
sudo npm run build

# Install PM2 (process manager)
sudo npm install -g pm2

# Start app
sudo pm2 start npm --name "warbot-app" -- start

# Configure PM2 to restart on reboot
sudo pm2 startup systemd -u root --hp /root
sudo pm2 save
```

### Step 4: Set Up Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/warbot-app
```

Paste this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/warbot-app /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 5: Set Up SSL (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com
```

### Step 6: Monitoring

```bash
# Check app status
sudo pm2 status

# View logs
sudo pm2 logs

# Monitor resources
sudo pm2 monit
```

### Updates

```bash
cd /var/www/warbot-app
git pull origin main
npm install
npm run build
sudo pm2 restart all
```

## Option 4: Cloud Platforms

### AWS EC2 + RDS

1. Launch EC2 instance (t3.small recommended)
2. Follow "Self-Hosted" instructions above
3. Use RDS for PostgreSQL instead of local database
4. Use S3 bucket for storage

### Google Cloud Run

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/warbot-app

# Deploy
gcloud run deploy warbot-app \
  --image gcr.io/PROJECT_ID/warbot-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars=NEXT_PUBLIC_SUPABASE_URL=your_url
```

### Azure Container Instances

```bash
# Build and push
az acr build --registry MyRegistry --image warbot-app:latest .

# Deploy
az container create \
  --resource-group MyGroup \
  --name warbot-app \
  --image MyRegistry.azurecr.io/warbot-app:latest \
  --environment-variables NEXT_PUBLIC_SUPABASE_URL=your_url
```

## Post-Deployment Checklist

After deploying:

- [ ] Application loads without errors
- [ ] Can create account and login
- [ ] Can upload screenshots
- [ ] Screenshots appear in gallery
- [ ] OCR processing works (if enabled)
- [ ] Database backups are running
- [ ] Monitoring/logging is set up
- [ ] Error emails/alerts configured
- [ ] SSL certificate is valid
- [ ] Custom domain pointing to app

## Monitoring and Maintenance

### View Logs

**Vercel:**
- Dashboard → Logs tab

**Docker:**
```bash
docker logs -f warbot-app
```

**Self-Hosted:**
```bash
pm2 logs
```

### Check Health

```bash
# Test endpoint
curl https://your-domain.com/

# Check Supabase connection
curl https://your-domain.com/api/health
```

### Database Backups

**Supabase:**
- Automatic daily backups (free tier)
- Can also create manual backups in dashboard

**Self-Hosted PostgreSQL:**
```bash
# Automatic backup
pg_dump -U postgres guild_scout_reports > backup.sql

# Schedule with cron
0 3 * * * pg_dump -U postgres guild_scout_reports > /backups/backup-$(date +\%Y\%m\%d).sql
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart (Vercel automatic, Docker/PM2 manual)
docker restart warbot-app
# or
pm2 restart all
```

## Troubleshooting Deployments

### Build Fails

```bash
# Check logs
npm run build

# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Error

- Verify `SUPABASE_DATABASE_URL` is correct
- Check IP whitelisting on database
- Verify SSL certificates are valid

### OCR Not Working

- Check `ANTHROPIC_API_KEY` is set
- Verify API key has valid credits
- Check server logs for errors

### Performance Issues

- Check server resources (CPU, RAM)
- Enable caching (Vercel automatic)
- Optimize images in gallery
- Use CDN for static assets (Vercel automatic)

## Cost Estimation

### Vercel
- **Pricing**: Free tier (1GB storage), then $20+/month
- **Estimated**: $0-50/month (small guild)

### Supabase
- **Pricing**: Free tier, then $25+/month
- **Estimated**: $0-25/month

### Anthropic API
- **Pricing**: $3 per 1M input tokens (images cheaper than text)
- **Estimated**: $1-10/month (10-100 screenshots)

### Docker/Self-Hosted
- **VPS**: $5-30/month
- **Bandwidth**: Usually included
- **Estimated**: $5-35/month

**Total Monthly Cost:**
- Vercel setup: $25-85/month
- Self-hosted: $5-35/month

## Scaling Considerations

### As You Grow

1. **More screenshots**
   - Add database indexes (already done)
   - Consider pagination in gallery
   - Add caching layer (Redis)

2. **More users**
   - Upgrade Vercel plan
   - Scale database (Supabase Pro)
   - Use CDN (Vercel automatic)

3. **OCR bottleneck**
   - Queue extraction requests
   - Use background job service
   - Cache results

## Security Hardening

### In Production

1. **Enable HTTPS** (automatic on Vercel)
2. **Set secure headers**:
   ```nginx
   add_header X-Frame-Options "DENY";
   add_header X-Content-Type-Options "nosniff";
   ```

3. **Rate limiting**:
   ```nginx
   limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
   ```

4. **Regular updates**:
   ```bash
   npm audit
   npm update
   ```

5. **Monitor access logs**
6. **Backup databases regularly**
7. **Rotate API keys quarterly**

## Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Docker Docs**: [docs.docker.com](https://docs.docker.com)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Ubuntu Server**: [ubuntu.com/server](https://ubuntu.com/server)

---

**Choose Vercel for easiest deployment, Docker for flexibility, or self-hosted for full control.**
