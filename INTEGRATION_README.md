# DevAssist Pro - Frontend + Backend Integration

This document provides a complete guide for the unified DevAssist Pro system that bridges the React/TypeScript frontend with the Python/FastAPI backend.

## 🏗️ Architecture Overview

The integration creates a seamless full-stack application with:

- **React Frontend** - Modern SPA with TypeScript, TailwindCSS, and PWA features
- **FastAPI Backend** - Microservices architecture with PostgreSQL and Redis
- **Real-time Communication** - WebSocket integration for live updates
- **Unified Authentication** - JWT-based auth with OAuth providers
- **Docker Orchestration** - Complete containerized deployment
- **Nginx Reverse Proxy** - Load balancing and SSL termination

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- Python 3.11+ (for development)

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys and configuration
nano .env
```

Required environment variables:
- `ANTHROPIC_API_KEY` - Claude AI integration
- `OPENAI_API_KEY` - GPT AI integration
- `GOOGLE_API_KEY` - Gemini AI integration
- OAuth credentials for authentication

### 2. Start the System

```bash
# Make scripts executable
chmod +x start-fullstack.sh test-integration.sh

# Start all services
./start-fullstack.sh
```

### 3. Test the Integration

```bash
# Run integration tests
./test-integration.sh
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Streamlit Legacy**: http://localhost:8501
- **Nginx Proxy**: http://localhost:80

## 📁 Integration Components

### Core Services

#### `/frontend/src/services/`
- **`unifiedApiClient.ts`** - Main API client for React-FastAPI communication
- **`authBridge.ts`** - Authentication bridge with JWT and OAuth
- **`websocketBridge.ts`** - Real-time WebSocket integration
- **`integrationService.ts`** - High-level integration workflows

#### `/frontend/src/types/`
- **`shared.ts`** - TypeScript types synchronized with Python models
- **`api.ts`** - API-specific type definitions
- **`auth.ts`** - Authentication type definitions

#### `/frontend/src/contexts/`
- **`AuthContext.tsx`** - Updated to use integration services

### Infrastructure

#### Docker Configuration
- **`docker-compose.fullstack.yml`** - Complete orchestration
- **`nginx.conf`** - Reverse proxy configuration
- **`Dockerfile.streamlit`** - Legacy Streamlit container

#### Scripts
- **`start-fullstack.sh`** - System startup automation
- **`test-integration.sh`** - Integration testing suite

## 🔧 Key Features

### 1. Unified API Client

```typescript
import { unifiedApiClient } from '@/services/unifiedApiClient';

// Automatic token management
const response = await unifiedApiClient.get('/api/projects');

// File upload with progress
const uploadResult = await unifiedApiClient.uploadDocument(file, {
  onProgress: (progress) => console.log(progress)
});
```

### 2. Real-time WebSocket

```typescript
import { websocketBridge } from '@/services/websocketBridge';

// Track analysis progress
websocketBridge.trackAnalysisProgress(analysisId, (progress) => {
  console.log(`${progress.stage}: ${progress.progress}%`);
});

// Subscribe to notifications
websocketBridge.subscribeToNotifications((notification) => {
  showNotification(notification);
});
```

### 3. Authentication Bridge

```typescript
import { authBridge } from '@/services/authBridge';

// Login with automatic token handling
const result = await authBridge.login({ email, password });

// OAuth integration
const oauthUrl = await authBridge.getOAuthUrl('google');
```

### 4. Type Synchronization

```typescript
// Shared types between frontend and backend
interface User {
  id: string;
  email: string;
  role: UserRole;
  subscription: UserSubscription;
  // ... synchronized with Python Pydantic models
}
```

## 🔄 Development Workflow

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Full-Stack Testing

```bash
# Run all tests
./test-integration.sh

# Monitor logs
docker-compose -f docker-compose.fullstack.yml logs -f

# Service status
docker-compose -f docker-compose.fullstack.yml ps
```

## 📊 Monitoring & Debugging

### Service Health Checks

```bash
# API health
curl http://localhost:8000/health

# Frontend status
curl http://localhost:3000

# WebSocket connection
wscat -c ws://localhost:8000/ws
```

### Log Analysis

```bash
# All services
docker-compose -f docker-compose.fullstack.yml logs

# Specific service
docker-compose -f docker-compose.fullstack.yml logs api-gateway

# Follow logs
docker-compose -f docker-compose.fullstack.yml logs -f frontend
```

### Database Access

```bash
# PostgreSQL
docker exec -it devassist_postgres_full psql -U devassist -d devassist_pro

# Redis
docker exec -it devassist_redis_full redis-cli -a redis_password
```

## 🔒 Security Configuration

### SSL/HTTPS Setup

1. Generate SSL certificates:
```bash
mkdir ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/devassist.key \
  -out ssl/devassist.crt
```

2. Update nginx.conf for HTTPS

3. Access via https://localhost:443

### Environment Security

- Store API keys in `.env` file (never commit)
- Use strong JWT secrets
- Configure CORS properly
- Enable rate limiting
- Regular security updates

## 🧪 Testing Strategy

### Integration Tests

The `test-integration.sh` script validates:
- Service connectivity
- API endpoints
- WebSocket communication
- Authentication flow
- Database connections
- Performance metrics

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Document upload and processing
- [ ] Real-time progress updates
- [ ] Analysis workflow
- [ ] Report generation
- [ ] OAuth authentication
- [ ] WebSocket reconnection
- [ ] Error handling

## 🚨 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check Docker status
docker system info

# Restart services
docker-compose -f docker-compose.fullstack.yml restart

# Clean rebuild
docker-compose -f docker-compose.fullstack.yml down -v
docker-compose -f docker-compose.fullstack.yml up --build
```

#### Authentication Errors
- Verify API keys in `.env`
- Check token expiration
- Validate OAuth configuration
- Review CORS settings

#### WebSocket Connection Failed
- Check firewall settings
- Verify WebSocket URL
- Test with `wscat`
- Review proxy configuration

#### Database Connection Issues
- Ensure PostgreSQL is running
- Check connection string
- Verify user permissions
- Review network configuration

### Performance Optimization

1. **Frontend**:
   - Enable code splitting
   - Optimize bundle size
   - Use React.memo for components
   - Implement virtual scrolling

2. **Backend**:
   - Add database indexes
   - Use connection pooling
   - Implement caching
   - Optimize AI model calls

3. **Infrastructure**:
   - Enable gzip compression
   - Use CDN for static assets
   - Configure load balancing
   - Monitor resource usage

## 📈 Deployment

### Production Deployment

1. **Environment Configuration**:
```bash
# Production .env
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql://user:pass@prod-db:5432/devassist_pro
```

2. **SSL Configuration**:
```bash
# Use proper SSL certificates
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/devassist.crt
SSL_KEY_PATH=/etc/ssl/private/devassist.key
```

3. **Scaling**:
```yaml
# docker-compose.prod.yml
services:
  api-gateway:
    deploy:
      replicas: 3
  frontend:
    deploy:
      replicas: 2
```

### CI/CD Pipeline

1. **GitHub Actions** (recommended):
```yaml
# .github/workflows/deploy.yml
name: Deploy DevAssist Pro
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: ./test-integration.sh
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch
3. Install dependencies
4. Run integration tests
5. Submit pull request

### Code Standards

- **Frontend**: ESLint + Prettier
- **Backend**: Black + isort
- **TypeScript**: Strict mode
- **Python**: Type hints required
- **Documentation**: JSDoc + Sphinx

## 📞 Support

### Getting Help

- **Documentation**: Check CLAUDE.md for project-specific guidelines
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions

### Maintenance

- Regular dependency updates
- Security patch monitoring
- Performance optimization
- Feature roadmap planning

---

## 🎯 Next Steps

The integration layer is now complete. Recommended next actions:

1. **Test the Integration**:
   ```bash
   ./start-fullstack.sh
   ./test-integration.sh
   ```

2. **Implement Backend Services**:
   - Create FastAPI microservices
   - Implement Pydantic models
   - Add business logic

3. **Enhance Frontend**:
   - Add React components
   - Implement state management
   - Create user interfaces

4. **Production Deployment**:
   - Configure CI/CD
   - Set up monitoring
   - Implement security measures

The foundation is solid - now you can build amazing features on top of this integrated architecture! 🚀

## 🎯 Next Steps

The integration layer is now complete. Recommended next actions:

1. **Test the Integration**:
   ```bash
   ./start-fullstack.sh
   ./test-integration.sh
   ```

2. **Implement Backend Services**:
   - Create FastAPI microservices
   - Implement Pydantic models
   - Add business logic

3. **Enhance Frontend**:
   - Add React components
   - Implement state management
   - Create user interfaces

4. **Production Deployment**:
   - Configure CI/CD
   - Set up monitoring
   - Implement security measures

The foundation is solid - now you can build amazing features on top of this integrated architecture! 🚀