# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Run the Streamlit Application (Current MVP)
```bash
streamlit run app.py
```
The application will be available at `http://localhost:8501`

### Run the React Frontend (Future Architecture)
```bash
cd frontend
npm install
npm start
```
The React app will be available at `http://localhost:3000`

### Install Dependencies
```bash
# Python dependencies
pip install -r requirements.txt

# Frontend dependencies
cd frontend && npm install
```

### Environment Setup
Create a `.env` file in the project root with:
```
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Linting and Type Checking
```bash
# Frontend
cd frontend
npm run lint
npm run type-check

# Python (if configured)
# Add linting commands as needed
```

## Architecture Overview

This is a **hybrid architecture application** transitioning from Streamlit MVP to a modern React SPA. The project consists of:

1. **Current MVP**: Streamlit-based tender analysis application 
2. **Future Target**: React SPA with FastAPI backend
3. **Purpose**: AI-powered analysis of commercial proposals (КП) against technical specifications (ТЗ)

### Current Streamlit Application Structure

- **Main Application**: `app.py` - Entry point with Streamlit configuration, extensive UI styling, session state management
- **Components** (`src/components/`): Modular Streamlit UI components
  - `file_upload.py` - File upload interface with drag-and-drop
  - `analysis.py` - AI analysis orchestration with progress indicators
  - `comparison_table.py` - Side-by-side comparison of proposals
  - `report.py` - Final report generation and export
  - `sidebar.py` - Navigation, model selection, and branding
- **Services** (`src/services/`): Core business logic
  - `ai_service.py` - AI model integration with OpenAI and Anthropic APIs, structured JSON response handling
  - `comparison_service.py` - Document comparison workflows
- **Configuration** (`src/config/settings.py`): Application settings, AI model definitions, brand colors, evaluation criteria
- **Utilities** (`src/utils/file_utils.py`): PDF/DOCX text extraction, image handling

### React Frontend Structure (In Development)

- **Components** (`frontend/src/components/`): React components organized by domain
  - `auth/` - Authentication forms and layouts
  - `common/` - Shared components like model selectors
  - `main/` - Core application sections (analysis, comparison, reports)
  - `ui/` - Base UI components (buttons, inputs, grids)
- **Pages** (`frontend/src/pages/`): Top-level page components
- **Services** (`frontend/src/services/`): API clients and service layers
- **Configuration** (`frontend/src/config/`): App configuration, model definitions, auth settings

### Application Flow

1. **Upload** - Users upload ТЗ (technical specification) and КП files (commercial proposals)
2. **Analysis** - AI models analyze each КП against the ТЗ using structured prompts
3. **Comparison** - Results displayed in tabular format with ratings and compliance scores
4. **Report** - Final recommendations generated using different AI models

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


Use environment variables exclusively for API keys in production.

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

### React Frontend Stack (In Development)
- **Framework**: React 18.2.0 with TypeScript
- **Build Tool**: Create React App / Vite
- **Styling**: TailwindCSS 3.2.7
- **Icons**: Lucide React 0.323.0
- **Animations**: Framer Motion 10.6.0
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router DOM 6.8.0

### Key Configuration Files

- **`src/config/settings.py`**: Central configuration hub containing:
  - AI model definitions (`AVAILABLE_MODELS`)
  - Brand colors (`BRAND_COLORS`) 
  - File format support (`SUPPORTED_FILE_FORMATS`)
  - Evaluation criteria (`EVALUATION_CRITERIA`)
  - Paths and directory structure
- **`frontend/package.json`**: React app dependencies and scripts
- **`requirements.txt`**: Python dependencies
- **`.env`**: Environment variables (API keys) - must be created manually

### Important File Locations

- **Main Entry Points**: 
  - Streamlit: `app.py`
  - React: `frontend/src/index.tsx`
- **AI Integration**: `src/services/ai_service.py` (contains hardcoded keys - security issue)
- **UI Components**: `src/components/` (Streamlit) and `frontend/src/components/` (React)
- **Styling**: Inline CSS in `app.py` (lines 83-360) for Streamlit theme overrides
- **Technical Spec**: `devassist_tech_spec.md` (comprehensive project requirements)

## Development Notes

- Application uses Russian language interface
- Brand colors and styling defined in `settings.BRAND_COLORS`
- Error handling includes user-friendly messages and fallbacks
- AI responses parsed as JSON with validation and default values
- Progress indication and status updates during long-running AI operations
- **Critical**: Remove hardcoded API keys from `ai_service.py` before production deployment