# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Run the Streamlit Application (Demo/Development)
```bash
streamlit run demo_app.py     # Main demo application
streamlit run simple_app.py   # Simple demo
streamlit run test_app.py     # Test application
```
The application will be available at `http://localhost:8501`

### Run Backend Microservices (Production Architecture)
```bash
cd backend
make setup      # First-time setup
make start      # Start all services
make status     # Check service status
make logs       # View logs
```
Backend services:
- API Gateway: `http://localhost:8000`
- API Docs: `http://localhost:8000/api/docs`
- Health Check: `http://localhost:8000/health`

### Run the React Frontend (Current Development)
```bash
cd frontend
npm install
npm start
```
The React app will be available at `http://localhost:3000`

### Build React Frontend for Production
```bash
cd frontend
npm run build
```

### Install Dependencies
```bash
# Python dependencies
pip install -r requirements.txt

# Frontend dependencies
cd frontend && npm install
```

### Environment Setup
Copy and configure environment files:
```bash
# Main environment configuration (114+ variables)
cp .env.example .env

# Frontend-specific environment
cp frontend/.env.example frontend/.env
```

Critical environment variables include:
- **AI Provider Keys**: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY
- **Database**: PostgreSQL connection settings
- **OAuth**: Google, Yandex, Microsoft client IDs and secrets
- **Security**: JWT secrets, encryption keys
- **Features**: Rate limiting, monitoring, email configuration

### Testing and Quality Assurance
```bash
# Frontend TypeScript checking and linting
cd frontend
npm run type-check    # TypeScript compilation check
npm run lint         # ESLint for code quality
npm test             # Run React tests
npm run storybook    # Launch Storybook component library
npm run docs         # Alias for storybook

# Backend testing (Russian-localized commands)
cd backend
make help            # Показать справку по командам
make test            # Run infrastructure tests
make test-auth       # Test authentication system
make test-all        # Run all backend tests

# Backend development utilities
make health          # Проверить здоровье всех сервисов
make shell-db        # Подключиться к PostgreSQL
make shell-redis     # Подключиться к Redis
make stop            # Остановить все сервисы
make clean           # Очистка данных (ОСТОРОЖНО!)

# Integration testing
./test-integration.sh # Comprehensive API and service testing
```

## Architecture Overview

This is a **multi-tier architecture application** with three main layers:

1. **Demo Applications**: Streamlit-based demo applications for development and testing
2. **Current Frontend**: React SPA with comprehensive authentication system and component library
3. **Production Backend**: FastAPI microservices with Docker orchestration
4. **Purpose**: AI-powered web portal for real estate developers, starting with КП Анализатор module

### Current Demo Applications Structure

- **Demo Applications**: 
  - `demo_app.py` - Main demonstration application
  - `simple_app.py` - Simplified demo version
  - `test_app.py` - Test application for development
- **Frontend Launcher**: `frontend_launcher.py` - Bridge between Streamlit and React frontend

### React Frontend Structure (Current Development)

- **Components** (`frontend/src/components/`): React components organized by domain
  - `auth/` - Complete authentication system with social login (Google, Yandex, VK)
  - `main/` - Core application sections (dashboard, analysis, comparison, reports) 
  - `ui/` - Base UI components (buttons, inputs, bento grids, loading spinners)
  - `admin/`, `ai/`, `documents/`, `visualization/` - Specialized component domains
- **Pages** (`frontend/src/pages/`): Top-level page components (Dashboard, AuthPage, MainPage, ProfilePage, AdminPage)
- **Services** (`frontend/src/services/`): API clients, WebSocket bridges, and service layers
- **Configuration** (`frontend/src/config/`): App configuration, model definitions, auth settings
- **Contexts** (`frontend/src/contexts/`): React contexts for authentication and theme management
- **Hooks** (`frontend/src/hooks/`): Custom hooks for auth, file upload, PDF export, document processing
- **Types** (`frontend/src/types/`): TypeScript type definitions synchronized with backend schemas
- **Stories** (`frontend/src/stories/`): Storybook component documentation and examples

### Backend Microservices Architecture (Production)

- **API Gateway** (`backend/api_gateway/`): Central entry point, request routing, authentication middleware
- **Core Services** (`backend/services/`):
  - `auth/` - User authentication and authorization with OAuth support
  - `llm/` - AI model orchestration with provider abstraction (OpenAI, Anthropic, Google)
  - `documents/` - Document processing and text extraction service
  - `dashboard/` - Dashboard data aggregation and statistics
- **Shared Components** (`backend/shared/`): Common models, schemas, database connections
- **Infrastructure**: PostgreSQL database, Redis caching, Docker containerization
- **Development Tools**: Comprehensive Makefile, health checks, logging

### Application Flow

1. **Authentication** - User login/registration with traditional and social authentication
2. **Upload** - Users upload ТЗ (technical specification) and КП files (commercial proposals)
3. **Analysis** - AI models analyze each КП against the ТЗ using structured prompts
4. **Comparison** - Results displayed in tabular format with ratings and compliance scores
5. **Report** - Final recommendations generated using different AI models

### Authentication Architecture (React Frontend)

The React frontend implements a comprehensive authentication system:

- **AuthContext** (`frontend/src/contexts/AuthContext.tsx`): Centralized authentication state management using React Context and useReducer
- **Authentication Types**: Traditional email/password + social login (Google, Yandex, VKontakte)
- **Session Management**: JWT token handling with automatic refresh and expiration tracking
- **Protected Routes**: Route guards and authentication guards for secure access
- **Forms**: Comprehensive forms with validation using React Hook Form + Zod
- **Social OAuth**: Complete OAuth 2.0 flow implementation with popup and redirect support
- **Security**: CSRF protection, state validation, and secure token storage

### AI Integration

- **Claude models** (via Anthropic API): Primary models for document analysis and comparison
  - Claude 3.7 Sonnet (User-requested)
  - Claude 3.5 Sonnet (Recommended)
  - Claude 3 Opus
- **GPT models** (via OpenAI API): Used for report generation and alternative analysis
  - GPT-4o
  - GPT-4.5 Preview
  - GPT-4 Turbo
- **Model Management**: Dual-model selection system (analysis model + comparison model)
- **Response Handling**: Structured JSON responses with comprehensive error handling and fallbacks
- **API Client Architecture**: Centralized client initialization with error-aware model selection
- **Important**: Contains hardcoded API keys in `ai_service.py` for development - MUST be removed before production

### Session State Management

Streamlit session state tracks:
- `current_step`: Application navigation (upload/analysis/comparison/report)
- `uploaded_files`: File metadata and paths
- `all_analysis_results`: AI analysis results for all proposals
- `selected_model`/`selected_comparison_model`: Currently selected AI models

### File Processing

- **Supported Formats**: PDF, DOCX (defined in `settings.SUPPORTED_FILE_FORMATS`)
- **Text Extraction**: Handled in `file_utils.py` with error handling
- **File Storage**: 
  - Uploads: `src/data/uploads/`
  - Results: `src/data/results/`
  - Assets: `src/assets/` (logos and branding)
- **Image Processing**: Base64 encoding for logos and branding elements

### UI Architecture and Styling

The application uses a sophisticated dark theme implementation:

- **Theme System**: Linear.app-inspired dark theme with forced styling
- **CSS Architecture**: Extensive inline CSS in `app.py` (lines 83-360) with strong selectors to override Streamlit defaults
- **Typography**: Inter font family with custom weight and spacing
- **Color Scheme**: Defined in `settings.BRAND_COLORS` - black/white/gray palette with purple accents
- **Component Styling**: Custom styling for buttons, file uploaders, expanders, alerts, tables
- **Layout**: Wide layout with custom sidebar branding and navigation
- **Animations**: CSS animations and transitions for modern feel
- **Responsive Design**: Custom breakpoints and container widths

**Important**: The current styling approach uses aggressive CSS overrides to transform Streamlit's appearance. When migrating to React, preserve the established design language.

## Development Rules and Guidelines

### Technical Specification Compliance

This project is implementing **DevAssist Pro** - an AI-powered web portal for real estate developers. The current module (КП Анализатор) is the first phase of a larger web portal architecture.

### Core Development Principles

1. **Web-First Architecture**: Build as a Progressive Web App (PWA) with SPA framework
2. **Modular Design**: Each module (КП Анализатор, ТЗ Генератор, etc.) should be independent but integrated
3. **AI-Centric**: All features should leverage LLM capabilities with proper orchestration
4. **Cursor Development**: Use Cursor IDE with AI-assisted code generation following established patterns
5. **Frontend Focus**: Developer will primarily work on Frontend development - prioritize UI/UX improvements, React migration, and client-side functionality

### Technology Stack Requirements

**Frontend Requirements:**
- React 18+ with TypeScript
- Streamlit for current MVP (to be migrated to React SPA)
- TailwindCSS for styling
- Responsive design (mobile-first approach)
- Progressive Web App features

**Backend Requirements:**
- Python 3.11+ with FastAPI (target architecture)
- Current: Streamlit with modular components
- AI orchestration with multiple providers (OpenAI, Anthropic, Google)
- Microservices architecture for scalability

**AI Integration:**
- Support multiple LLM providers with fallback logic
- Streaming responses for real-time feedback
- Cost tracking and usage analytics
- Intelligent caching and error handling

### Module Development Pattern

When creating new modules, follow this structure:
```
src/modules/[module-name]/
├── components/     # UI components
├── services/       # Business logic and AI calls
├── types/          # TypeScript interfaces
├── config/         # Module configuration
└── utils/          # Helper functions
```

### UI/UX Guidelines

1. **Design System**: Modern glassmorphism with smooth animations
2. **Color Scheme**: Use brand colors defined in `settings.BRAND_COLORS`
3. **Russian Language**: All user-facing text must be in Russian
4. **Accessibility**: WCAG 2.1 Level AA compliance
5. **Performance**: Core Web Vitals optimization

### AI Development Standards

1. **Prompt Engineering**: Store prompts in dedicated configuration files
2. **Response Handling**: Always parse AI responses as JSON with validation
3. **Error Handling**: Implement graceful fallbacks for AI failures
4. **Streaming**: Use streaming responses for long-running operations
5. **Cost Management**: Track and limit AI usage per user/operation

#### Current AI Service Patterns

The `ai_service.py` implements several key patterns:

- **Dual Model Architecture**: Separate models for analysis vs comparison tasks
- **JSON Response Parsing**: Robust parsing with markdown cleanup and fallback handling
- **Function Specialization**: 
  - `extract_kp_summary_data()` - Extracts structured company/tech/pricing data
  - `compare_tz_kp()` - Performs detailed compliance analysis
  - `generate_recommendation()` - Creates structured recommendations
- **Error Recovery**: Comprehensive try-catch with user-friendly error messages
- **Temperature Control**: Low temperature (0.1) for consistent extraction

#### Critical Security Issue

**WARNING**: `ai_service.py` contains hardcoded API keys (lines 26-29). This MUST be fixed before production:

```python
# REMOVE THIS BEFORE PRODUCTION
```

Use environment variables exclusively for API keys in production.

#### AI Service Integration Patterns

**Backend LLM Orchestration** (`backend/services/llm/`):
- **Provider Abstraction**: Unified interface for OpenAI, Anthropic, Google providers
- **Fallback Logic**: Automatic provider switching on failures
- **Cost Tracking**: Usage monitoring per user/operation
- **Streaming Support**: Real-time response streaming for long operations
- **Prompt Management**: Centralized prompt templates with versioning

**Frontend AI Integration** (`frontend/src/services/ai/`):
- **Real-time Streaming**: WebSocket connections for live AI responses
- **Progress Tracking**: Visual feedback during long AI operations
- **Error Recovery**: Graceful handling of AI service failures
- **Caching**: Client-side caching of AI responses to reduce costs
- **Model Selection**: User-configurable model preferences

### Security Requirements

- HTTPS everywhere
- Input validation and sanitization
- Rate limiting for AI endpoints
- User authentication and authorization
- Data privacy compliance (GDPR/152-ФЗ)

### Performance Standards

- First Contentful Paint < 1.5 seconds
- Document processing < 30 seconds
- Report generation < 60 seconds
- 99.9% uptime SLA

### Code Quality Standards

1. **TypeScript**: Use strict typing for all new code
2. **Error Boundaries**: Implement proper error handling
3. **Testing**: Write tests for critical business logic
4. **Documentation**: Document all AI prompts and configurations
5. **Code Reviews**: Follow established patterns and conventions

### Migration Path

Current Streamlit app is MVP phase. Future development should:
1. Maintain current functionality during transition
2. Gradually migrate to React SPA architecture
3. Implement shared services for AI orchestration
4. Add proper authentication and multi-tenancy
5. Scale to full web portal with multiple modules

### Developer Role Focus

**Primary Responsibility: Frontend Development**
- Focus on UI/UX improvements and user experience optimization
- Lead the migration from Streamlit to React SPA architecture
- Implement responsive design and Progressive Web App features
- Create reusable component libraries and design systems
- Handle client-side state management and routing
- Integrate with existing backend APIs without modifying server-side logic
- Prioritize frontend performance optimization and accessibility compliance

**Backend Interaction:**
- Work with existing API endpoints and services
- Suggest backend improvements but avoid direct backend development
- Focus on client-side integration with AI services
- Handle frontend error states and loading management

## Technology Stack

### Current Streamlit Stack
- **Python**: 3.8+ (requirements in `requirements.txt`)
- **Framework**: Streamlit 1.30.0+
- **AI Libraries**: 
  - `anthropic>=0.10.0` (Anthropic API)
  - `openai>=1.10.0` (OpenAI API)
- **Document Processing**: PyPDF2, python-docx
- **Other**: pandas, plotly, python-dotenv, pydantic

### React Frontend Stack (Current Development)
- **Framework**: React 18.2.0 with TypeScript 4.9.5
- **Build Tool**: Create React App with CRACO for configuration
- **Styling**: TailwindCSS 3.2.7 with custom glassmorphism design
- **Icons**: Lucide React 0.323.0 
- **Animations**: Framer Motion 10.18.0
- **Forms**: React Hook Form 7.43.2 + Zod 3.20.6 validation
- **Routing**: React Router DOM 6.8.0
- **State Management**: React Context, useReducer, Zustand, React Query
- **File Processing**: React Dropzone, html2canvas, jsPDF, PDF.js
- **Real-time**: Socket.io client for WebSocket connections
- **Component Library**: Storybook with accessibility testing
- **Utilities**: Class Variance Authority, clsx, tailwind-merge for styling
- **Development**: ESLint, TypeScript compiler, React Testing Library

### Key Configuration Files

**Backend Configuration:**
- **`backend/shared/config.py`**: Centralized configuration hub for all microservices
- **`backend/Makefile`**: Russian-localized development commands and utilities
- **`backend/docker-compose.dev.yml`**: Development environment with PostgreSQL and Redis
- **`backend/docker-compose.yml`**: Production microservices configuration
- **`docker-compose.fullstack.yml`**: Complete full-stack deployment
- **`docker-compose.quick.yml`**: Fast development startup

**Frontend Configuration:**
- **`frontend/package.json`**: React dependencies with Storybook integration
- **`frontend/.eslintrc.js`**: ESLint configuration with React and TypeScript rules
- **`frontend/tailwind.config.js`**: TailwindCSS with glassmorphism utilities and design tokens
- **`frontend/tsconfig.json`**: TypeScript configuration with path mapping (`@/` aliases)
- **`frontend/craco.config.js`**: Webpack configuration for Create React App
- **`frontend/src/config/auth.ts`**: Authentication with validation rules and social providers
- **`frontend/src/types/shared.ts`**: TypeScript interfaces synchronized with backend schemas

**Infrastructure Configuration:**
- **`nginx.conf`**: Production Nginx reverse proxy with CORS and WebSocket support
- **`.env.example`**: Comprehensive environment template (114+ variables)
- **`frontend/.env.example`**: Frontend-specific environment variables

**Development Scripts:**
- **`start-fullstack.sh`**: Automated full-stack startup with health checks
- **`start-react-frontend.sh`**: React frontend launcher with validation
- **`test-integration.sh`**: Comprehensive integration testing framework
- **`restart-backend.sh`**: Backend restart utility

### Key React Authentication Components

- **AuthProvider** (`frontend/src/contexts/AuthContext.tsx`): Main authentication context with state management
- **LoginForm** (`frontend/src/components/auth/LoginForm.tsx`): Login form with social authentication integration
- **SocialLoginPanel** (`frontend/src/components/auth/SocialLoginPanel.tsx`): Social login buttons (Google, Yandex, VK)
- **ProtectedRoute** (`frontend/src/components/auth/ProtectedRoute.tsx`): Route protection component
- **AuthGuard** (`frontend/src/components/auth/AuthGuard.tsx`): Authentication guard with role-based access
- **useAuth** (`frontend/src/contexts/AuthContext.tsx`): Main authentication hook
- **useSocialAuth** (`frontend/src/hooks/useSocialAuth.ts`): Social authentication hook with OAuth flow

### Important File Locations

- **Main Entry Points**: 
  - Demo Apps: `demo_app.py`, `simple_app.py`, `test_app.py`
  - React: `frontend/src/index.tsx`
  - Backend Gateway: `backend/api_gateway/main.py`
- **React Components**: `frontend/src/components/` with domain-based organization
- **Backend Services**: `backend/services/` with microservice architecture
- **Shared Types**: `frontend/src/types/shared.ts` and `backend/shared/`
- **Storybook**: `frontend/src/stories/` for component documentation
- **Technical Spec**: `docs/devassist_tech_spec.md` (comprehensive project requirements)

## Development Notes

### Language and Localization
- **Interface Language**: Russian language interface throughout
- **Developer Comments**: Russian comments in shell scripts and Makefile
- **Error Messages**: Russian-localized error messages in backend

### Design System
- **Brand Colors**: Defined in `settings.BRAND_COLORS` (black/white/gray with purple accents)
- **Theme**: Glassmorphism design with Linear.app inspiration
- **Typography**: Inter font family with custom spacing
- **TailwindCSS**: Custom configuration with design tokens and animations

### Technical Patterns
- **Error Handling**: User-friendly messages with comprehensive fallbacks
- **AI Integration**: JSON parsing with validation and default values
- **Progress Tracking**: Real-time updates during long AI operations
- **State Management**: Multiple patterns (Context, Zustand, React Query)

### Critical Security Issues
- **URGENT**: Remove hardcoded API keys from `ai_service.py` before production
- **URGENT**: Remove hardcoded API key from `run-streamlit.sh` script
- **Required**: Use environment variables exclusively for all credentials

### Current Development Status (React Frontend)

The React frontend is actively developed with the following completed features:
- ✅ **Complete Authentication System**: Email/password + social login (Google, Yandex, VK)
- ✅ **Dashboard with Bento Grid**: Modern card-based dashboard with statistics
- ✅ **Component Library**: Storybook integration with accessibility testing
- ✅ **Responsive Design**: Mobile-first approach with TailwindCSS
- ✅ **TypeScript Integration**: Full type safety with synchronized backend schemas
- ✅ **Modern UI Components**: Glassmorphism design with smooth animations
- ✅ **Router Integration**: Multi-page application with protected routes
- ✅ **File Processing**: PDF export, document upload, and processing capabilities
- ✅ **Real-time Features**: WebSocket integration and live updates
- ✅ **State Management**: Multiple patterns (Context, Zustand, React Query)

### Component Architecture Patterns

**Domain-Driven Organization:**
```
frontend/src/components/
├── auth/           # Authentication flows and guards
├── main/           # Core business logic components
├── ui/             # Reusable design system components
├── admin/          # Administrative interface
├── kpAnalyzer/     # КП Analyzer specific components
├── documents/      # Document processing components
├── visualization/  # Charts and data visualization
└── realtime/       # WebSocket and live update components
```

**Key Architectural Patterns:**
- **Compound Components**: Complex UI components with multiple related parts
- **Render Props**: Flexible component composition for data fetching
- **Custom Hooks**: Business logic abstraction (useAuth, useFileUpload, etc.)
- **Context Providers**: Centralized state management for authentication and theme
- **Error Boundaries**: Graceful error handling and fallback UI
- **HOCs**: Higher-order components for authentication guards and role-based access

### Integration Points

- **AuthProvider Setup**: Must wrap App component in `index.tsx` for authentication context
- **Multi-App Architecture**: React frontend (port 3000) → Streamlit app (port 8501) → Backend services (port 8000)
- **Authentication Flow**: React handles login/registration → redirects to Streamlit for КП analysis → calls backend APIs
- **Environment Variables**: Social login requires OAuth client IDs, backend requires database credentials
- **Docker Development**: Backend services run in Docker containers with hot reload support
- **API Gateway**: All backend services accessed through centralized gateway with authentication middleware

### Development Workflow

1. **Full Stack Development**:
   ```bash
   ./start-fullstack.sh        # Automated full-stack startup with validation
   # OR manually:
   cd backend && make start    # Start microservices (port 8000)
   streamlit run demo_app.py   # Start Streamlit MVP (port 8501) 
   cd frontend && npm start    # Start React SPA (port 3000)
   ```

2. **Frontend-Only Development**:
   ```bash
   ./start-react-frontend.sh   # React with environment validation
   # OR manually:
   cd frontend && npm start    # React with mock APIs
   ```

3. **Backend-Only Development**:
   ```bash
   cd backend && make start && make logs
   ./restart-backend.sh        # Quick backend restart utility
   ```

4. **Quick Development**:
   ```bash
   docker-compose -f docker-compose.quick.yml up  # Fast startup
   ./run-streamlit.sh          # Streamlit in Docker container
   ```

## Deployment Configurations

### Docker Compose Environments

1. **Development Environment** (`docker-compose.dev.yml`):
   - Hot reload for all services
   - Debug logging enabled
   - Local volume mounts
   - Development database with sample data

2. **Production Environment** (`docker-compose.yml`):
   - Optimized builds with multi-stage Dockerfiles
   - Health checks and restart policies
   - Security hardening
   - Environment-based configuration

3. **Full-Stack Deployment** (`docker-compose.fullstack.yml`):
   - Complete application stack
   - Nginx reverse proxy
   - SSL/HTTPS configuration
   - Production-ready settings

4. **Quick Development** (`docker-compose.quick.yml`):
   - Minimal service set for rapid iteration
   - Reduced startup time
   - Essential services only

### Production Deployment

```bash
# Production deployment with Nginx
docker-compose -f docker-compose.fullstack.yml up -d

# Scale specific services
docker-compose -f docker-compose.yml up --scale api-gateway=3

# Health monitoring
docker-compose exec api-gateway curl http://localhost:8000/health
```