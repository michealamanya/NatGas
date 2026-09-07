# NATGAS Uganda — Deployment Guide

## Requirements

| Component | Version |
|-----------|---------|
| Node.js | 20 LTS |
| npm | 10+ (bundled with Node 20) |
| PostgreSQL | 15+ |
| Nginx | 1.24+ |
| PM2 | 5+ (`npm install -g pm2`) |
| OS | Ubuntu 22.04 LTS (recommended) |

---

## First-time server setup

### 1. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # must print v20.x.x
```

### 2. Install PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create the database and user:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER natgas WITH PASSWORD 'strong-password-here';
CREATE DATABASE natgas OWNER natgas;
GRANT ALL PRIVILEGES ON DATABASE natgas TO natgas;
SQL
```

### 3. Install PM2

```bash
npm install -g pm2
```

### 4. Install Nginx

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
```

---

## Application deployment

### 5. Clone the repository

```bash
sudo mkdir -p /var/www/natgas
sudo chown $USER:$USER /var/www/natgas
cd /var/www/natgas
git clone https://github.com/your-org/natgas-uganda.git .
```

### 6. Configure environment variables

```bash
cp server/.env.example server/.env
nano server/.env   # set all REQUIRED values (see .env.example comments)
```

Critical values to set:
- `DATABASE_URL` — PostgreSQL connection string with production credentials
- `SESSION_SECRET` — minimum 32 random characters (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
- `CORS_ORIGINS` — exact production domain(s), e.g. `https://natgasuganda.com`
- `CLIENT_URL` — production domain for email links, e.g. `https://natgasuganda.com`
- `NODE_ENV=production`
- SMTP credentials for outgoing email

### 7. Install dependencies

```bash
npm install --workspace=server
npm install --workspace=client
```

### 8. Generate Prisma client and run migrations

```bash
cd /var/www/natgas
npx prisma generate --schema=server/prisma/schema.prisma
npx prisma migrate deploy --schema=server/prisma/schema.prisma
```

**Do not run `prisma migrate dev` in production.** Use `migrate deploy` which applies pending migrations without creating new ones.

### 9. Seed initial data (first deploy only)

```bash
# Only required on a fresh database — skips records that already exist.
npm run db:seed --workspace=server
```

> **Security:** The seed script creates a default SUPER_ADMIN account at
> `admin@natgasuganda.com` with password `NatGas@Admin2024!`.
> **Change this password immediately after first login.**

### 10. Build the application

```bash
# Build the server (TypeScript → dist/)
npm run build --workspace=server

# Build the React frontend (outputs to client/dist/)
npm run build --workspace=client
```

### 11. Create log directory

Winston writes structured logs to `./logs/` in production:

```bash
mkdir -p /var/www/natgas/logs
```

### 12. Start the API with PM2

```bash
cd /var/www/natgas
pm2 start ecosystem.config.cjs --env production
pm2 save           # persist process list across reboots
pm2 startup        # follow the printed command to enable start-on-boot
```

Verify the API is running:

```bash
pm2 list
curl http://127.0.0.1:3001/api/health
# Expected: {"status":"ok","services":{"database":"healthy"}}
```

### 13. Configure Nginx

```bash
sudo cp /var/www/natgas/nginx.conf.example /etc/nginx/sites-available/natgasuganda.com
sudo nano /etc/nginx/sites-available/natgasuganda.com
# Replace all occurrences of natgasuganda.com with your actual domain
# Update /var/www/natgas paths if you deployed elsewhere

sudo ln -s /etc/nginx/sites-available/natgasuganda.com /etc/nginx/sites-enabled/
sudo nginx -t           # must print "syntax is ok / test is successful"
sudo systemctl reload nginx
```

### 14. Obtain TLS certificate

```bash
sudo certbot --nginx -d natgasuganda.com -d www.natgasuganda.com
```

Certbot modifies the Nginx config to add TLS directives and sets up automatic renewal.

### 15. Verify the full deployment

```bash
# API health check
curl https://natgasuganda.com/api/health

# Check PM2 process status
pm2 status

# Tail application logs
pm2 logs natgas-api --lines 50

# Check Nginx error log
sudo tail -f /var/log/nginx/natgas_error.log
```

---

## Routine updates (subsequent deploys)

```bash
cd /var/www/natgas

# 1. Pull latest code
git pull origin main

# 2. Install any new dependencies
npm install --workspace=server
npm install --workspace=client

# 3. Run any new database migrations
npx prisma migrate deploy --schema=server/prisma/schema.prisma

# 4. Rebuild
npm run build --workspace=server
npm run build --workspace=client

# 5. Reload the API (PM2 performs a graceful reload — zero downtime)
pm2 reload natgas-api

# 6. Reload Nginx if nginx.conf.example changed
sudo nginx -t && sudo systemctl reload nginx
```

---

## Rollback procedure

If a deploy causes errors, roll back to the previous release:

```bash
cd /var/www/natgas

# 1. Identify the previous good commit
git log --oneline -10

# 2. Check out the previous commit (replace HASH)
git checkout HASH

# 3. Rebuild from the reverted code
npm run build --workspace=server
npm run build --workspace=client

# 4. Reload the API
pm2 reload natgas-api
```

If the new deploy included a database migration that needs reversing, restore from backup before rolling back the code (see Backup section below). Prisma does not generate automatic down-migrations.

---

## Database backup

### Manual backup

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U natgas -h localhost natgas | gzip > /backups/natgas_${TIMESTAMP}.sql.gz
```

### Automated daily backup (cron)

```bash
# Create backup directory
sudo mkdir -p /backups/natgas
sudo chown $USER:$USER /backups/natgas

# Add to crontab: daily at 02:00
crontab -e
```

Add:
```
0 2 * * * pg_dump -U natgas -h localhost natgas | gzip > /backups/natgas/natgas_$(date +\%Y\%m\%d).sql.gz && find /backups/natgas -name "*.sql.gz" -mtime +30 -delete
```

This keeps 30 days of backups and deletes older ones automatically.

### Restore from backup

```bash
gunzip -c /backups/natgas/natgas_20260901.sql.gz | psql -U natgas -h localhost natgas
```

---

## Uploaded media backup (local storage)

If using `STORAGE_PROVIDER=local`, the `server/uploads/` directory contains all user-uploaded files. Back it up alongside the database:

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/natgas/uploads_${TIMESTAMP}.tar.gz /var/www/natgas/server/uploads/
```

For production workloads, migrate to S3-compatible object storage (`STORAGE_PROVIDER=s3`) which provides built-in redundancy and version history.

---

## Environment variable reference

See `server/.env.example` for the full list of variables with descriptions and defaults.

---

## Useful PM2 commands

```bash
pm2 list                    # show all processes
pm2 status                  # same, shorter format
pm2 logs natgas-api         # tail live logs
pm2 logs natgas-api --lines 200   # last 200 lines
pm2 reload natgas-api       # graceful reload (zero downtime)
pm2 restart natgas-api      # hard restart
pm2 stop natgas-api         # stop without removing
pm2 delete natgas-api       # remove from PM2 registry
pm2 monit                   # live dashboard
```

---

## Useful Nginx commands

```bash
sudo nginx -t                        # test config syntax
sudo systemctl reload nginx          # apply config changes (no downtime)
sudo systemctl restart nginx         # full restart (brief downtime)
sudo tail -f /var/log/nginx/natgas_error.log    # watch errors
sudo tail -f /var/log/nginx/natgas_access.log   # watch access log
```

---

## Health monitoring

The API exposes a health endpoint that returns HTTP 200 when healthy and 503 when the database is unreachable:

```
GET https://natgasuganda.com/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-09-03T10:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy"
  }
}
```

Configure your monitoring service (UptimeRobot, BetterUptime, etc.) to poll this endpoint every 60 seconds and alert on non-200 responses.
