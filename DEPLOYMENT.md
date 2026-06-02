# Production Deployment Guide

## AI Blog CMS — Strapi v5 + Next.js + PostgreSQL + Docker

---

## Pre-flight Checklist

- [ ] VPS or cloud server (Ubuntu 22.04 recommended, minimum 2 vCPU / 4GB RAM)
- [ ] Domain name pointed to server IP (A record)
- [ ] GitHub repository with secrets configured
- [ ] Docker and Docker Compose v2 installed on server

---

## 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Nginx (for Let's Encrypt)
sudo apt install nginx certbot python3-certbot-nginx -y

# Create app directory
sudo mkdir -p /opt/ai-blog-cms
sudo chown $USER:$USER /opt/ai-blog-cms
```

---

## 2. SSL Certificates (Let's Encrypt)

```bash
# Stop nginx temporarily for certbot
sudo systemctl stop nginx

# Get SSL certificates
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d api.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --non-interactive

# Copy certs to project
mkdir -p /opt/ai-blog-cms/nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/ai-blog-cms/nginx/ssl/frontend.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem   /opt/ai-blog-cms/nginx/ssl/frontend.key
sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem /opt/ai-blog-cms/nginx/ssl/api.crt
sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem   /opt/ai-blog-cms/nginx/ssl/api.key

# Set up auto-renewal
echo "0 0 * * * certbot renew --quiet && docker compose -f /opt/ai-blog-cms/docker-compose.prod.yml restart nginx" | crontab -
```

---

## 3. Environment Configuration

```bash
cd /opt/ai-blog-cms

# Backend secrets — generate with: openssl rand -base64 32
cat > backend/.env.production << 'EOF'
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

APP_KEYS=GENERATE_ME_1,GENERATE_ME_2,GENERATE_ME_3,GENERATE_ME_4
API_TOKEN_SALT=GENERATE_ME
ADMIN_JWT_SECRET=GENERATE_ME
TRANSFER_TOKEN_SALT=GENERATE_ME
JWT_SECRET=GENERATE_ME

DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=aiblog_prod
DATABASE_USERNAME=aiblog
DATABASE_PASSWORD=STRONG_PASSWORD_HERE
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

FRONTEND_URL=https://yourdomain.com
STRAPI_ADMIN_BACKEND_URL=https://api.yourdomain.com

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=YOUR_SENDGRID_API_KEY
SMTP_FROM=noreply@yourdomain.com

CLOUDINARY_NAME=your_cloud
CLOUDINARY_KEY=your_key
CLOUDINARY_SECRET=your_secret

OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4-turbo-preview

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CACHE_TTL_BLOGS=300
AUDIT_LOG_ENABLED=true
EOF

# Frontend
cat > frontend/.env.production << 'EOF'
NEXT_PUBLIC_STRAPI_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRAPI_API_TOKEN=your_strapi_readonly_token
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=AI Blog CMS
NEXT_PUBLIC_SITE_DESCRIPTION=A modern AI-powered blog platform
REVALIDATE_SECRET=your_revalidate_secret
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
EOF
```

---

## 4. Deploy

```bash
cd /opt/ai-blog-cms

# Pull latest code
git clone https://github.com/yourusername/ai-blog-cms.git .

# Build and start production stack
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 5. First-time Strapi Admin Setup

```bash
# Wait for Strapi to start (~60 seconds)
docker compose -f docker-compose.prod.yml logs strapi -f

# Visit https://api.yourdomain.com/admin
# Create the first administrator account
# Go to Settings → API Tokens → Create "readonly" token for frontend
```

### Configure Permissions in Admin Panel

1. **Settings → Users & Permissions → Roles → Public:**
   - Blog: find, findOne (slug, trending, search, related)
   - Category: find, findOne (slug)
   - Tag: find
   - Comment: findByBlog
   - Newsletter: subscribe, confirm, unsubscribe

2. **Settings → Users & Permissions → Roles → Authenticated:**
   - All Public permissions +
   - Comment: create, like
   - Blog: create, update (own), generate

---

## 6. Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/_health

# Frontend
curl https://yourdomain.com

# Database
docker exec aiblog_postgres pg_isready -U aiblog

# Redis
docker exec aiblog_redis redis-cli -a $REDIS_PASSWORD ping
```

---

## 7. Monitoring & Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs

# Strapi logs only
docker compose -f docker-compose.prod.yml logs strapi -f --tail=100

# Nginx access logs
docker exec aiblog_nginx tail -f /var/log/nginx/access.log
```

---

## 8. Backup Strategy

```bash
#!/bin/bash
# /opt/backup.sh — run daily via cron

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

mkdir -p $BACKUP_DIR

# Database backup
docker exec aiblog_postgres pg_dump \
  -U aiblog aiblog_prod \
  | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Uploads backup
docker run --rm \
  -v aiblog_strapi_uploads:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/uploads_$DATE.tar.gz /data

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Schedule daily backup at 2am
echo "0 2 * * * /opt/backup.sh >> /var/log/backup.log 2>&1" | crontab -
```

---

## 9. Scaling

### Horizontal scaling (multiple Strapi instances)
```yaml
# docker-compose.prod.yml
strapi:
  deploy:
    replicas: 3
```
> Ensure `APP_KEYS` and `JWT_SECRET` are the same across all instances. Uses Redis as shared rate-limit and cache store.

### Database read replica
```js
// backend/config/env/production/database.js
module.exports = {
  connection: {
    client: 'postgres',
    connection: { /* primary */ },
    readReplicas: [{ /* replica */ }],
  },
};
```

---

## 10. Performance Optimisation Checklist

- [ ] Enable Cloudinary for image CDN
- [ ] Set `CACHE_TTL_BLOGS=600` for higher-traffic sites
- [ ] Enable Redis `maxmemory-policy allkeys-lru`
- [ ] Configure Nginx proxy cache for static uploads
- [ ] Enable ISR revalidation webhook from Strapi lifecycle hooks
- [ ] Set up Sentry DSN for error tracking
- [ ] Configure Google Analytics / GTM
- [ ] Enable Gzip in Nginx (already in nginx.conf)
- [ ] Set up CDN (Cloudflare) in front of Nginx
- [ ] Monitor with Grafana + Prometheus (optional)

---

## 11. GitHub Actions Secrets

Add these secrets in your repo Settings → Secrets:

| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | Your server IP |
| `DEPLOY_USER` | SSH user (e.g. `ubuntu`) |
| `DEPLOY_SSH_KEY` | Private SSH key |
| `SLACK_WEBHOOK_URL` | Slack notifications |

---

## Estimated Costs (Monthly)

| Component | Provider | Est. Cost |
|-----------|----------|-----------|
| VPS (2 vCPU, 4GB) | DigitalOcean / Hetzner | $12–20 |
| Managed PostgreSQL | Optional | $15+ |
| Cloudinary | Free tier (25GB) | $0–$99 |
| SendGrid Email | Free tier (100/day) | $0–$15 |
| Cloudflare CDN | Free tier | $0 |
| **Total** | | **~$12–35/mo** |
