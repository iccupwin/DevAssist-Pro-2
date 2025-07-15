#!/bin/bash

echo "🚀 Starting Frontend in Safe Mode..."

cd frontend

# Set environment variables to bypass problematic ESLint plugins
export DISABLE_ESLINT_PLUGIN=true
export ESLINT_NO_DEV_ERRORS=true
export SKIP_PREFLIGHT_CHECK=true

# Start React app
npm start