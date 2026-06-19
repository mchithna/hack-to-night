# HTN26 Production Deployment Guide

## Quick Start

### Step 1: Prepare Your Server
```bash
# SSH into your server
ssh root@your-server-ip

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone Your Repository
```bash
cd /opt
git clone <your-repo-url>
cd hack-to-night
```

### Step 3: Configure Production Environment
```bash
# Copy and edit the production environment file
cp .env.production.example .env.production

# Edit with strong, secure values
nano .env.production
```

**Important values to change:**
- `POSTGRES_PASSWORD` - Use a strong random password (32+ characters)
- `JWT_SECRET` - Use a strong random token
- `DATABASE_URL` - Update with your server's hostname if needed

Generate strong passwords:
```bash
# On Linux/Mac
openssl rand -base64 32
```

### Step 4: Make Scripts Executable
```bash
chmod +x deploy.sh build-prod.sh
```

### Step 5: Deploy
```bash
# Build and start the application
./deploy.sh
```

### Step 6: Verify Deployment
```bash
# Check running containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Test the application
curl http://localhost:3000
```

---

## Deployment Options

### Option A: VPS (Recommended for beginners)
**Providers:** DigitalOcean, Linode, Vultr, AWS EC2

**Pros:** Full control, affordable, simple setup
**Cons:** You manage updates, backups, scaling

**Commands:**
```bash
# Once on your server, just run:
./deploy.sh
```

---

### Option B: Container Registry + Cloud Deployment
**Registry:** Docker Hub, GitHub Container Registry, AWS ECR

**Step 1: Build and push image**
```bash
# Build the production image
docker build -f Dockerfile.prod -t your-username/htn-app:latest .

# Push to Docker Hub (or your registry)
docker push your-username/htn-app:latest
```

**Step 2: Deploy with your registry image**
Edit `docker-compose.prod.yml` and change the app section:
```yaml
app:
  image: your-username/htn-app:latest
  # Remove the 'build:' section
```

Then on your server:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

### Option C: Kubernetes (Advanced)
For multi-node, auto-scaling deployments. Recommended if you have multiple servers or need high availability.

---

## SSL/HTTPS Setup

### Using Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Update nginx.conf with your domain and certificates
# Uncomment and configure the HTTPS server block in nginx.conf
```

Then restart nginx:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## Production Checklist

- [ ] Strong database password set
- [ ] JWT_SECRET configured
- [ ] SSL/HTTPS certificate installed
- [ ] Firewall configured (only ports 80, 443 exposed)
- [ ] Database backups scheduled
- [ ] Logs monitored
- [ ] Health checks enabled
- [ ] Environment variables secured

---

## Useful Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update and redeploy
git pull origin main
./deploy.sh

# Database backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres htn26db > backup.sql

# Database restore
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres htn26db < backup.sql
```

---

## Troubleshooting

**Container won't start:**
```bash
docker-compose -f docker-compose.prod.yml logs app
```

**Database connection error:**
- Check `.env.production` DATABASE_URL is correct
- Verify database is healthy: `docker-compose -f docker-compose.prod.yml ps db`

**Port already in use:**
```bash
# Use different ports in docker-compose.prod.yml
# Or kill the process using the port
sudo lsof -i :80
```

**Out of disk space:**
```bash
# Clean up unused images/containers
docker system prune -a
```

---

## Support & Resources

- Docker Docs: https://docs.docker.com
- Next.js Deployment: https://nextjs.org/docs/app/building-your-application/deploying
- PostgreSQL Backup: https://www.postgresql.org/docs/current/backup.html
