# DevAssist Pro Frontend

React-based frontend for DevAssist Pro - AI-powered web portal for real estate developers.

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm start
```

Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Build

```bash
npm run build
```

Builds the app for production to the `build` folder.

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # React components
│   │   ├── auth/        # Authentication components
│   │   └── ui/          # Reusable UI components
│   ├── pages/           # Page components
│   ├── types/           # TypeScript type definitions
│   ├── config/          # Configuration files
│   └── styles/          # CSS and styling
├── package.json
└── README.md
```

## Features

### Authentication
- Login/Register forms with validation
- Social login (Google, Microsoft, Яндекс)
- Password recovery
- Form validation with react-hook-form and zod
- Responsive design

### UI Components
- Modern glassmorphism design
- Tailwind CSS styling
- Lucide React icons
- Smooth animations with Framer Motion
- Full responsive design

## Technology Stack

- **React 18** - Frontend framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **React Router** - Navigation
- **Lucide React** - Icons

## Design System

Based on DevAssist Pro brand colors:
- Primary: #2E75D6 (Blue)
- Secondary: #1A1E3A (Dark Blue)
- Accent: #FF5F08 (Orange)
- Background: #F4F7FC (Light Gray)

## API Integration

The authentication forms are ready for backend integration. Update the API calls in:
- `src/pages/AuthPage.tsx` - Replace mock functions with real API calls
- Add proper error handling and success states
- Implement token management and storage

## Deployment

This frontend is designed to be deployed as a static site and can be served by any web server or CDN.

For production deployment:
1. Run `npm run build`
2. Serve the `build` directory contents
3. Configure routing for SPA (single page application)