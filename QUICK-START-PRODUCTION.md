# 🚀 DevAssist Pro - Quick Start Production Guide
**Ubuntu 22.04 Server (46.149.71.162) - One Command Deployment**

## ⚡ TL;DR - One Command Deployment

```bash
# Step 1: Clone repository
git clone <repository-url> && cd DevAssist-Pro

# Step 2: Configure environment (update API keys)
cp .env.production.example .env.production
nano .env.production  # Update ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY

# Step 3: Deploy everything
./deploy-production.sh deploy
```

**✅ That's it! Visit http://46.149.71.162 to see your application running.**

---

## 📋 What Gets Deployed

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| **Nginx** | `devassist_nginx_prod` | 80 | Reverse proxy, static files |
| **Frontend** | `devassist_frontend_prod` | - | React SPA application |
| **Backend** | `devassist_app_prod` | 8000 | FastAPI application |
| **PostgreSQL** | `devassist_postgres_prod` | 5432 | Primary database |
| **Redis** | `devassist_redis_prod` | 6379 | Cache and sessions |

## 🔑 Required Configuration

**Before deployment, update these in `.env.production`:**

```bash
# AI Provider API Keys (REQUIRED)
ANTHROPIC_API_KEY=your_real_anthropic_key_here
OPENAI_API_KEY=your_real_openai_key_here  
GOOGLE_API_KEY=your_real_google_key_here
```

*All other settings (passwords, secrets) are auto-generated securely.*

## 🌐 Access URLs

After deployment:
- **Application**: http://46.149.71.162/
- **API**: http://46.149.71.162/api/
- **API Docs**: http://46.149.71.162/api/docs
- **Health Check**: http://46.149.71.162/health

## ⚙️ Quick Commands

```bash
# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f

# Restart all services
docker compose -f docker-compose.production.yml restart

# Stop everything
docker compose -f docker-compose.production.yml down

# Health check
./deploy-production.sh health
```

## 🛠 Deployment Script Options

```bash
./deploy-production.sh deploy    # Full deployment
./deploy-production.sh check     # System readiness check
./deploy-production.sh health    # Health check all services
./deploy-production.sh logs      # View service logs
./deploy-production.sh stop      # Stop all services
./deploy-production.sh restart   # Restart all services
./deploy-production.sh help      # Show help
```

## 🔒 Security Features

✅ **Automatically configured:**
- UFW firewall (ports 22, 80, 443)
- Secure auto-generated passwords
- Docker network isolation  
- Nginx security headers
- CORS protection

## 🚨 Quick Troubleshooting

### Problem: Services won't start
```bash
# Check what's wrong
docker compose -f docker-compose.production.yml logs

# Check system resources
free -h && df -h

# Restart deployment
./deploy-production.sh deploy
```

### Problem: Can't access website
```bash
# Check nginx status
docker compose -f docker-compose.production.yml ps nginx

# Test health endpoint
curl http://46.149.71.162/health

# Check firewall
sudo ufw status
```

### Problem: API errors
```bash
# Check backend logs
docker compose -f docker-compose.production.yml logs app

# Verify environment variables
grep -v "^#" .env.production
```

## 🔄 Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d --build

# Verify
./deploy-production.sh health
```

## 📦 What the Script Does

1. **System Check**: Verifies Ubuntu 22.04, installs Docker if needed
2. **Security**: Configures UFW firewall, generates secure passwords
3. **Environment**: Creates production config from template
4. **Deployment**: Builds and starts all containers with health checks
5. **Verification**: Tests all endpoints and service connectivity
6. **Auto-restart**: Sets up systemd service for reboot persistence

## 🎯 Success Criteria

✅ **Deployment successful when:**
- All containers show "healthy" status
- Frontend loads at http://46.149.71.162/
- API responds at http://46.149.71.162/api/health
- Health check passes: `./deploy-production.sh health`

## 📞 Need Help?

1. **Check logs**: `docker compose -f docker-compose.production.yml logs`
2. **Run health check**: `./deploy-production.sh health`
3. **Read full guide**: [README-PRODUCTION-UBUNTU.md](README-PRODUCTION-UBUNTU.md)
4. **Check troubleshooting**: See full documentation for detailed solutions

---

## 🎉 Next Steps After Deployment

1. **Test the application** - Upload documents, test KP Analyzer
2. **Setup SSL certificate** - `sudo certbot --nginx -d yourdomain.com`
3. **Configure monitoring** - Setup log monitoring and alerts
4. **Regular backups** - Schedule database and file backups
5. **Performance tuning** - Monitor and optimize based on usage

**🚀 DevAssist Pro is now running in production!**