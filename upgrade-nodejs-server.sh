#!/bin/bash

# Node.js Upgrade Script for Production Server
# Safe upgrade from v12 to v18 LTS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🚀 Node.js Upgrade Script for Production Server"
echo "==============================================="
echo ""

# Check current version
if command -v node &> /dev/null; then
    CURRENT_VERSION=$(node --version)
    log_info "Current Node.js version: $CURRENT_VERSION"
else
    log_error "Node.js not found"
    exit 1
fi

# Check if we're running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    log_error "This script requires root privileges"
    echo "Please run with: sudo $0"
    exit 1
fi

echo ""
echo "This script will upgrade Node.js from v12 to v18 LTS"
echo "Current packages will be preserved in /opt/nodejs-backup"
echo ""
read -p "Continue with upgrade? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Upgrade cancelled"
    exit 0
fi

# Create backup of current Node.js
log_info "Creating backup of current Node.js installation..."
mkdir -p /opt/nodejs-backup
if [ -d "/usr/lib/nodejs" ]; then
    cp -r /usr/lib/nodejs /opt/nodejs-backup/ || true
fi
if [ -f "/usr/bin/node" ]; then
    cp /usr/bin/node /opt/nodejs-backup/ || true
fi
if [ -f "/usr/bin/npm" ]; then
    cp /usr/bin/npm /opt/nodejs-backup/ || true
fi

# Update package lists
log_info "Updating package lists..."
apt-get update

# Remove old Node.js
log_info "Removing old Node.js installation..."
apt-get remove -y nodejs npm 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

# Clean old repository if it exists
rm -f /etc/apt/sources.list.d/nodesource.list
apt-key del 9FD3B784BC1C6FC31A8A0A1C1655A0AB68576280 2>/dev/null || true

# Add Node.js 18.x repository
log_info "Adding Node.js 18.x repository..."
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -
echo "deb https://deb.nodesource.com/node_18.x $(lsb_release -cs) main" > /etc/apt/sources.list.d/nodesource.list
echo "deb-src https://deb.nodesource.com/node_18.x $(lsb_release -cs) main" >> /etc/apt/sources.list.d/nodesource.list

# Update package lists again
apt-get update

# Install Node.js 18
log_info "Installing Node.js 18 LTS..."
apt-get install -y nodejs

# Verify installation
if command -v node &> /dev/null; then
    NEW_VERSION=$(node --version)
    log_success "Node.js upgraded successfully: $NEW_VERSION"
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "NPM version: $NPM_VERSION"
    else
        log_error "NPM not found after installation"
    fi
else
    log_error "Node.js installation failed"
    exit 1
fi

# Install yarn if needed
log_info "Installing Yarn (optional)..."
npm install -g yarn 2>/dev/null || log_warning "Yarn installation failed (not critical)"

# Set proper permissions
log_info "Setting proper permissions..."
if [ -d "/usr/lib/node_modules" ]; then
    chown -R root:root /usr/lib/node_modules
    chmod -R 755 /usr/lib/node_modules
fi

# Update npm to latest
log_info "Updating NPM to latest version..."
npm install -g npm@latest

echo ""
log_success "Node.js upgrade completed successfully!"
echo ""
echo "Versions:"
echo "  Node.js: $(node --version)"
echo "  NPM: $(npm --version)"
echo ""
echo "Backup location: /opt/nodejs-backup"
echo ""
echo "You can now run the production build:"
echo "  ./build-production-frontend.sh"
echo ""

# Test basic functionality
log_info "Testing basic Node.js functionality..."
if node -e "console.log('Node.js is working!')" 2>/dev/null; then
    log_success "Node.js test passed"
else
    log_warning "Node.js test failed"
fi

if npm --version >/dev/null 2>&1; then
    log_success "NPM test passed"
else
    log_warning "NPM test failed"
fi

echo ""
log_info "Upgrade process completed. You may need to restart your shell session."