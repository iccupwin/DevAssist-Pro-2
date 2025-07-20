# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevAssist Pro is an AI-powered web portal for real estate developers featuring a microservices architecture with React frontend and FastAPI backend services. The application implements a modular system with the KP Analyzer (Commercial Proposal Analyzer) as the first operational module.

## Development Commands

### Frontend Commands (React SPA)
```bash
cd frontend
npm install                    # Install dependencies
npm start                     # Start development server (localhost:3000)
npm run build                 # Build for production
npm run test                  # Run tests
npm run test:coverage         # Run tests with coverage
npm run test:e2e              # Run Playwright e2e tests
npm run lint                  # Run ESLint
npm run lint:fix              # Fix ESLint issues
npm run type-check            # TypeScript type checking
npm run validate              # Run all checks (type-check + lint + test:coverage)
npm run storybook             # Start Storybook (localhost:6006)
```

### Backend Commands (Python/FastAPI)
```bash
cd backend

# Using Makefile (recommended)
make help                     # Show available commands
make setup                    # Initial project setup
make start                    # Start all services in development mode
make stop                     # Stop all services
make restart                  # Restart services
make logs                     # View logs
make test                     # Run all tests
make health                   # Check service health
make clean                    # Clean all data (DANGEROUS)

# Direct commands
python tests/run_all_tests.py            # Run all tests
python tests/integration/test_*.py       # Run specific integration tests
python backend/api_gateway/main.py       # Start API Gateway directly
python backend/services/llm/main.py      # Start LLM service directly
```

### Docker Commands
```bash
# Full application
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f        # Follow logs

# Development mode
docker-compose -f backend/docker-compose.dev.yml up -d
docker-compose -f backend/docker-compose.dev.yml down
```

## Architecture Overview

### Microservices Backend Structure
- **API Gateway** (`:8000`) - Main entry point, request routing
- **Auth Service** (`:8001`) - User authentication and authorization
- **LLM Service** (`:8002`) - AI model orchestration (OpenAI, Anthropic, Google)
- **Documents Service** (`:8003`) - File upload and processing
- **Analytics Service** (`:8004`) - Data analytics and metrics
- **Reports Service** (`:8005`) - Report generation (PDF, Excel)
- **Dashboard Service** (`:8006`) - Dashboard data aggregation

### Frontend Architecture (React SPA)
- **Modular structure** with lazy-loaded modules
- **Shared components** for consistent UI
- **State management** with Zustand stores
- **API integration** with React Query
- **Design system** using Tailwind CSS + shadcn/ui

### Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS, React Query, Zustand
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL, Redis
- **AI/ML**: OpenAI SDK, Anthropic SDK, streaming responses
- **Infrastructure**: Docker, Nginx, WebSocket support

## Module System

### Current Modules
1. **KP Analyzer** (`/kp-analyzer`) - Commercial proposal analysis against technical specifications
2. **Dashboard** (`/`) - Main portal with module overview and analytics

### Adding New Modules
When creating a new module, follow this pattern:

1. **Frontend Module Structure**:
```
frontend/src/
├── components/[module-name]/     # Module-specific components
├── pages/[ModuleName].tsx        # Main module page
├── stores/[module]Store.ts       # Zustand store
├── types/[module].ts             # TypeScript types
└── hooks/[module]Hooks.ts        # Custom hooks
```

2. **Backend Service Structure**:
```
backend/services/[module]/
├── main.py                       # FastAPI service entry
├── core/                         # Business logic
├── requirements.txt              # Service dependencies
└── Dockerfile                    # Service containerization
```

3. **Add routing** in `frontend/src/pages/index.tsx`
4. **Register service** in API Gateway (`backend/api_gateway/main.py`)
5. **Update shared models** in `backend/shared/models.py`

## AI Integration

### LLM Orchestrator
The system uses a centralized LLM orchestrator that supports:
- **Multiple providers**: OpenAI, Anthropic, Google AI
- **Model fallbacks**: Automatic switching on failures
- **Streaming responses**: Real-time AI output
- **Cost tracking**: Per-request usage monitoring
- **Prompt management**: Template-based prompt system

### AI Configuration
- Models configured in `frontend/src/config/api.ts`
- Provider settings in `backend/services/llm/config.py`
- API keys managed via environment variables
- Usage limits enforced per user/organization

## Database Models

### Core Entities
- **User** - User accounts and profiles
- **Organization** - Multi-tenant organization support
- **Project** - Project containers for analysis work
- **Document** - File storage and metadata
- **Analysis** - AI analysis results and metrics
- **Report** - Generated reports and exports

### Migrations
```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## Testing Strategy

### Frontend Testing
- **Unit tests**: React components with Jest
- **E2E tests**: Playwright for user flows
- **Coverage target**: 80% minimum across all metrics
- **Storybook**: Component documentation and testing

### Backend Testing
- **Integration tests**: Full service testing
- **Unit tests**: Individual service components
- **API tests**: Endpoint validation
- **Test files**: `backend/tests/` directory structure

## API Design

### Request/Response Patterns
- **RESTful endpoints** with consistent HTTP methods
- **JSON responses** with standardized error format
- **WebSocket support** for real-time updates
- **Streaming responses** for AI operations
- **File upload** with multipart form data

### Authentication
- **JWT tokens** for API authentication
- **RBAC** (Role-Based Access Control)
- **Organization-level** access controls
- **API keys** for programmatic access

## File Processing

### Supported Formats
- **PDF** - Text extraction with OCR fallback
- **DOCX/DOC** - Microsoft Word documents
- **XLSX** - Excel spreadsheets
- **TXT** - Plain text files

### Processing Pipeline
1. **Upload** → Document service
2. **Validation** → File type and size checks
3. **Extraction** → Text content extraction
4. **Storage** → Database + file system/S3
5. **Analysis** → AI processing via LLM service

## Environment Configuration

### Required Environment Variables
```bash
# Database
POSTGRES_URL=postgresql://user:pass@localhost:5432/devassist_pro
REDIS_URL=redis://localhost:6379/0

# AI Providers
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
GOOGLE_API_KEY=your_key

# Application
DEBUG=false
ENVIRONMENT=production
MAX_FILE_SIZE=50MB
ALLOWED_ORIGINS=http://localhost:3000
```

### Development Setup
1. Copy `.env.example` to `.env`
2. Configure database and Redis connections
3. Add AI provider API keys
4. Run `make setup` for initial configuration

## Deployment

### Production Deployment
- **Docker Compose** for container orchestration
- **Nginx** for reverse proxy and static file serving
- **PostgreSQL** for primary database
- **Redis** for caching and session storage
- **Health checks** for service monitoring

### Service URLs (Production)
- **Frontend**: Port 80 (via Nginx)
- **API Gateway**: Port 8000
- **Backend Services**: Internal network only

## Performance Considerations

### Frontend Optimization
- **Lazy loading** for module components
- **Code splitting** for reduced bundle size
- **React Query** for efficient API caching
- **Optimistic updates** for better UX

### Backend Optimization
- **Connection pooling** for database
- **Redis caching** for frequently accessed data
- **Async processing** for AI operations
- **Request timeout** handling (2 minutes for AI)

## Security Measures

### Frontend Security
- **Environment variable** validation
- **API endpoint** protection
- **File upload** validation
- **XSS protection** via React defaults

### Backend Security
- **CORS** configuration
- **Input validation** with Pydantic
- **SQL injection** protection via SQLAlchemy
- **Rate limiting** per user/organization
- **Secure headers** via middleware

## Troubleshooting

### Common Issues
1. **Service startup failures**: Check environment variables and dependencies
2. **AI API errors**: Verify API keys and rate limits
3. **File upload issues**: Check file size and format restrictions
4. **Database connection errors**: Verify PostgreSQL and Redis connectivity

### Debugging Commands
```bash
# Check service health
curl http://localhost:8000/health

# View service logs
make logs
docker-compose logs -f [service_name]

# Test database connection
make shell-db

# Test Redis connection
make shell-redis
```

## Code Style and Standards

### TypeScript/React
- **Strict TypeScript** configuration
- **ESLint** with React and TypeScript rules
- **Prettier** for code formatting
- **Component patterns**: Functional components with hooks
- **State management**: Zustand for global state, React Query for server state

### Python/FastAPI
- **Type hints** required for all functions
- **Pydantic models** for request/response validation
- **Async/await** patterns for I/O operations
- **SQLAlchemy** ORM for database operations
- **Error handling** with proper HTTP status codes

### Git Workflow
- **Feature branches** for development
- **Pull requests** for code review
- **Conventional commits** for clear history
- **No direct commits** to main branch
