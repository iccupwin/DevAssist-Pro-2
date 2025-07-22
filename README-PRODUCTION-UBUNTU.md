# DevAssist Pro Production Deployment Guide
# Ubuntu 22.04 Server Setup

🚀 **Complete production deployment guide for DevAssist Pro on Ubuntu 22.04 server (46.149.71.162)**

## 📋 Overview

This guide provides step-by-step instructions for deploying DevAssist Pro in production mode with:
- **Multi-container architecture**: Nginx + Frontend + Backend + PostgreSQL + Redis
- **One-command deployment**: Automated setup script
- **Production optimizations**: Security, performance, monitoring
- **High availability**: Health checks, auto-restart, persistent storage

## 🎯 Architecture

```
Ubuntu 22.04 Server (46.149.71.162:80)
├── Nginx Reverse Proxy (Container)
│   ├── Frontend Routes (/) → Frontend Container
│   ├── API Routes (/api) → Backend Container  
│   └── WebSocket (/ws) → Backend Container
├── Frontend Container (React SPA)
├── Backend Container (FastAPI)
├── PostgreSQL Database Container
└── Redis Cache Container
```

## 🔧 Prerequisites

### System Requirements
- **OS**: Ubuntu 22.04 LTS
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB free space
- **Network**: Port 80 and 443 open
- **Access**: SSH access with sudo privileges

### Required Software (Auto-installed by script)
- Docker Engine 20.10+
- Docker Compose v2
- curl, wget, openssl
- UFW firewall (optional)

## 🚀 Quick Deployment (One Command)

### Step 1: Clone and Setup
```bash
# On Ubuntu 22.04 server
git clone <repository-url>
cd DevAssist-Pro

# Make deployment script executable
chmod +x deploy-production.sh
```

### Step 2: Configure Environment
```bash
# Copy and edit environment file
cp .env.production.example .env.production

# Update required values:
nano .env.production
```

**Required Updates in .env.production:**
```bash
# Update these API keys (REQUIRED)
ANTHROPIC_API_KEY=your_real_anthropic_key
OPENAI_API_KEY=your_real_openai_key  
GOOGLE_API_KEY=your_real_google_key

# Passwords will be auto-generated securely
```

### Step 3: Deploy
```bash
# Single command deployment
./deploy-production.sh deploy
```

**That's it!** 🎉 The script will:
- Install Docker if needed
- Configure firewall
- Generate secure passwords
- Build and start all services
- Perform health checks
- Setup auto-restart on reboot

## 📁 File Structure

```
DevAssist-Pro/
├── docker-compose.production.yml    # Main production config
├── .env.production                  # Environment variables
├── deploy-production.sh             # One-command deployment
├── frontend/
│   └── Dockerfile.prod             # Frontend production build
├── nginx/
│   └── default.conf                # Nginx reverse proxy config
├── backend/
│   └── Dockerfile.monolith         # Backend container config
└── README-PRODUCTION-UBUNTU.md     # This guide
```

## 🔐 Security Configuration

### Automatic Security Features
- **Firewall**: UFW configured for ports 22, 80, 443
- **Secrets**: Auto-generated secure passwords
- **CORS**: Configured for production domain
- **Headers**: Security headers via Nginx
- **Network**: Isolated Docker network

### Manual Security Steps
```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Configure SSH (recommended)
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no (if using keys)
sudo systemctl restart ssh

# 3. Setup SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🔍 Service Management

### Common Commands
```bash
# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f

# Restart services
docker compose -f docker-compose.production.yml restart

# Stop services
docker compose -f docker-compose.production.yml down

# Update and restart
git pull
docker compose -f docker-compose.production.yml up -d --build
```

### Individual Service Commands
```bash
# Backend logs
docker compose -f docker-compose.production.yml logs -f app

# Frontend logs  
docker compose -f docker-compose.production.yml logs -f frontend

# Database logs
docker compose -f docker-compose.production.yml logs -f postgres

# Nginx logs
docker compose -f docker-compose.production.yml logs -f nginx
```

## 🏥 Health Checks & Monitoring

### Service Health Endpoints
- **Overall**: `http://46.149.71.162/health`
- **Frontend**: `http://46.149.71.162/`
- **API**: `http://46.149.71.162/api/health`
- **Documentation**: `http://46.149.71.162/api/docs`

### Manual Health Checks
```bash
# Check all services
./deploy-production.sh health

# Check individual containers
docker compose -f docker-compose.production.yml ps

# Check logs for errors
docker compose -f docker-compose.production.yml logs --tail=100

# Test endpoints
curl -f http://46.149.71.162/health
curl -f http://46.149.71.162/api/health
```

### System Resources
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker resource usage
docker system df
docker stats
```

## 💾 Data Persistence & Backup

### Persistent Volumes
```bash
# List volumes
docker volume ls | grep devassist

# Backup database
docker compose -f docker-compose.production.yml exec postgres pg_dump -U devassist_user devassist_pro > backup.sql

# Backup uploaded files
docker run --rm -v devassist_app_data:/source -v $(pwd):/backup alpine tar czf /backup/app_data_backup.tar.gz -C /source .
```

### Restore from Backup
```bash
# Restore database
docker compose -f docker-compose.production.yml exec -T postgres psql -U devassist_user devassist_pro < backup.sql

# Restore files
docker run --rm -v devassist_app_data:/target -v $(pwd):/backup alpine tar xzf /backup/app_data_backup.tar.gz -C /target
```

## 🔄 Updates & Maintenance

### Application Updates
```bash
# 1. Pull latest code
git pull origin main

# 2. Update environment if needed
nano .env.production

# 3. Rebuild and restart
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d --build

# 4. Verify deployment
./deploy-production.sh health
```

### System Maintenance
```bash
# Update Ubuntu packages
sudo apt update && sudo apt upgrade -y

# Clean Docker resources
docker system prune -f
docker volume prune -f

# Check disk space
df -h
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Services Won't Start
```bash
# Check container status
docker compose -f docker-compose.production.yml ps

# Check logs for errors
docker compose -f docker-compose.production.yml logs

# Check system resources
free -h
df -h
```

#### 2. Frontend Not Loading
```bash
# Check nginx configuration
docker compose -f docker-compose.production.yml exec nginx nginx -t

# Check frontend container
docker compose -f docker-compose.production.yml logs frontend

# Test direct container access
curl -f http://localhost:3000/
```

#### 3. API Not Responding
```bash
# Check backend logs
docker compose -f docker-compose.production.yml logs app

# Test backend directly
curl -f http://localhost:8000/health

# Check database connection
docker compose -f docker-compose.production.yml exec postgres pg_isready -U devassist_user
```

#### 4. Database Connection Issues
```bash
# Check postgres container
docker compose -f docker-compose.production.yml ps postgres

# Check database logs
docker compose -f docker-compose.production.yml logs postgres

# Test database connection
docker compose -f docker-compose.production.yml exec postgres psql -U devassist_user -d devassist_pro -c "SELECT 1;"
```

#### 5. Permission Issues
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
sudo chown -R $USER:$USER .
```

### Debug Mode
```bash
# Enable debug logging
echo "DEBUG=true" >> .env.production

# Restart with debug
docker compose -f docker-compose.production.yml restart app

# View detailed logs
docker compose -f docker-compose.production.yml logs -f app
```

## 🔧 Advanced Configuration

### Custom Domain Setup
```bash
# 1. Update DNS A record to point to 46.149.71.162
# 2. Update environment file
sed -i 's/46.149.71.162/yourdomain.com/g' .env.production

# 3. Update nginx configuration
sed -i 's/46.149.71.162/yourdomain.com/g' nginx/default.conf

# 4. Setup SSL
sudo certbot --nginx -d yourdomain.com

# 5. Restart services
docker compose -f docker-compose.production.yml restart nginx
```

### Performance Tuning
```bash
# Increase worker processes in .env.production
echo "WORKERS=8" >> .env.production

# Optimize PostgreSQL
echo "POSTGRES_SHARED_BUFFERS=256MB" >> .env.production
echo "POSTGRES_EFFECTIVE_CACHE_SIZE=1GB" >> .env.production

# Restart services
docker compose -f docker-compose.production.yml restart
```

### Load Balancing (Multiple Servers)
```bash
# For high availability, deploy on multiple servers:
# 1. Setup each server with same configuration
# 2. Use external load balancer (nginx, HAProxy, AWS ALB)
# 3. Use external database (AWS RDS, managed PostgreSQL)
# 4. Use shared storage for uploaded files (AWS S3, NFS)
```

## 📊 Monitoring & Logging

### Log Management
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/docker-containers

# Configure centralized logging (optional)
# Use ELK stack, Splunk, or cloud logging services
```

### Metrics Collection
```bash
# Setup Prometheus monitoring (optional)
# Monitor Docker metrics, application metrics
# Create Grafana dashboards
```

## 🆘 Support & Maintenance

### Getting Help
- **Documentation**: This README and CLAUDE.md
- **Issues**: Check logs and troubleshooting section
- **Updates**: Follow git repository for updates

### Regular Maintenance Schedule
- **Daily**: Monitor logs and resource usage
- **Weekly**: Check for security updates
- **Monthly**: Full backup and restore test
- **Quarterly**: Performance review and optimization

---

## ✅ Deployment Checklist

Before going live, ensure:

- [ ] All API keys configured in .env.production
- [ ] DNS pointing to 46.149.71.162
- [ ] SSL certificate installed (for HTTPS)
- [ ] Firewall configured correctly
- [ ] Backup strategy implemented
- [ ] Monitoring setup
- [ ] Health checks passing
- [ ] Performance tested
- [ ] Security review completed

## 🚀 Post-Deployment

After successful deployment:

1. **Test all functionality** through the web interface
2. **Setup monitoring** and alerting
3. **Document any customizations** made
4. **Train team members** on deployment and maintenance
5. **Setup automated backups**
6. **Create incident response plan**

---

**🎉 Congratulations! DevAssist Pro is now running in production on Ubuntu 22.04!**

For any issues or questions, refer to the troubleshooting section above or check the application logs.