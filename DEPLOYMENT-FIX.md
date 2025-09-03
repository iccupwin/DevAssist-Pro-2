# 🔧 DevAssist Pro Deployment Fix

## 🚨 Issue Identified

The deployment failed because:
1. The script was trying to use `docker-compose.monolith.yml` instead of `docker-compose.production.yml`
2. The frontend Dockerfile had syntax issues with COPY heredoc commands
3. Missing environment variables

## ✅ Quick Fix

Run these commands on your server:

```bash
# 1. Stop any running containers
docker compose -f docker-compose.monolith.yml down 2>/dev/null || true
docker compose -f docker-compose.production.yml down 2>/dev/null || true

# 2. Clean up old containers
docker ps -a --format "table {{.Names}}" | grep "devassist" | xargs -r docker rm -f || true

# 3. Use the fixed deployment script
./fix-deployment.sh
```

## 🛠 Alternative Manual Deployment

If the fix script doesn't work, run these commands manually:

```bash
# 1. Ensure you have the correct environment file
cp .env.production.example .env.production

# 2. Update API keys in .env.production (REQUIRED)
nano .env.production
# Update: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY

# 3. Build and start with production compose file
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d

# 4. Wait for services to start
sleep 30

# 5. Check status
docker compose -f docker-compose.production.yml ps

# 6. Test endpoints
curl http://localhost/health
curl http://localhost/
```

## 📋 Verify Deployment

After running the fix, verify everything is working:

```bash
# Check all containers are running
docker compose -f docker-compose.production.yml ps

# Test health endpoints
curl -f http://46.149.71.162/health
curl -f http://46.149.71.162/
curl -f http://46.149.71.162/api/health

# View logs if needed
docker compose -f docker-compose.production.yml logs -f
```

## 🔄 Service Management

```bash
# View logs
docker compose -f docker-compose.production.yml logs -f

# Restart services
docker compose -f docker-compose.production.yml restart

# Stop services
docker compose -f docker-compose.production.yml down

# Start services
docker compose -f docker-compose.production.yml up -d
```

## 🎯 Expected Result

After the fix:
- ✅ Frontend accessible at: http://46.149.71.162/
- ✅ Backend API at: http://46.149.71.162/api/
- ✅ Health check at: http://46.149.71.162/health
- ✅ All containers running healthy

## 🆘 If Issues Persist

1. **Check logs**: `docker compose -f docker-compose.production.yml logs`
2. **Check disk space**: `df -h`
3. **Check memory**: `free -h`
4. **Verify files exist**: 
   - `ls -la docker-compose.production.yml`
   - `ls -la frontend/Dockerfile.prod`
   - `ls -la .env.production`

## 🔑 Environment Variables Required

Make sure these are set in `.env.production`:

```bash
# REQUIRED - Update these with real values
ANTHROPIC_API_KEY=your_real_key_here
OPENAI_API_KEY=your_real_key_here
GOOGLE_API_KEY=your_real_key_here

# Auto-generated (don't change)
POSTGRES_PASSWORD=auto_generated_secure_password
REDIS_PASSWORD=auto_generated_secure_password
JWT_SECRET=auto_generated_secure_secret
```

The deployment should work correctly after applying this fix!