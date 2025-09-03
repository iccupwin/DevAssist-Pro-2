#!/bin/bash

# Node.js Installation Script for DevAssist Pro
# Installs Node.js v18 LTS for better compatibility with modern React

set -euo pipefail

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

echo "🚀 Node.js Installation for DevAssist Pro"
echo "========================================="
echo ""

# Check current Node.js version
if command -v node &> /dev/null; then
    CURRENT_NODE=$(node --version)
    log_info "Current Node.js version: $CURRENT_NODE"
else
    log_info "Node.js not found"
    CURRENT_NODE=""
fi

# Function to install Node.js via NodeSource repository
install_nodejs_nodesource() {
    log_info "Installing Node.js v18 LTS via NodeSource repository..."
    
    # Download and install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    
    # Install Node.js
    sudo apt-get update
    sudo apt-get install -y nodejs
    
    # Verify installation
    if command -v node &> /dev/null; then
        NEW_VERSION=$(node --version)
        log_success "Node.js installed: $NEW_VERSION"
        log_success "NPM version: $(npm --version)"
        return 0
    else
        log_error "Node.js installation failed"
        return 1
    fi
}

# Function to install Node.js via NVM
install_nodejs_nvm() {
    log_info "Installing Node.js v18 LTS via NVM..."
    
    # Install NVM if not present
    if [ ! -f "$HOME/.nvm/nvm.sh" ]; then
        log_info "Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        source ~/.bashrc
    fi
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && source "$NVM_DIR/bash_completion"
    
    # Install Node.js 18
    nvm install 18
    nvm use 18
    nvm alias default 18
    
    # Verify installation
    if command -v node &> /dev/null; then
        NEW_VERSION=$(node --version)
        log_success "Node.js installed via NVM: $NEW_VERSION"
        log_success "NPM version: $(npm --version)"
        return 0
    else
        log_error "Node.js installation via NVM failed"
        return 1
    fi
}

# Check if we need to install or upgrade
NEED_INSTALL=false

if [ -z "$CURRENT_NODE" ]; then
    log_info "Node.js not installed, will install v18 LTS"
    NEED_INSTALL=true
else
    # Check if version is too old (less than v16)
    MAJOR_VERSION=$(echo "$CURRENT_NODE" | sed 's/v//' | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -lt 16 ]; then
        log_warning "Node.js $CURRENT_NODE is too old for modern React"
        log_info "Will install Node.js v18 LTS"
        NEED_INSTALL=true
    else
        log_success "Node.js $CURRENT_NODE is compatible"
        echo ""
        echo "Your Node.js version is already suitable for building DevAssist Pro."
        echo "You can run the build script directly:"
        echo "  ./build-production-frontend.sh"
        exit 0
    fi
fi

if [ "$NEED_INSTALL" = true ]; then
    echo ""
    echo "Choose installation method:"
    echo "1) NodeSource repository (recommended for servers)"
    echo "2) NVM (Node Version Manager)"
    echo "3) Cancel"
    echo ""
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            if install_nodejs_nodesource; then
                log_success "Installation completed successfully!"
            else
                log_error "Installation failed. You may need to install manually."
                exit 1
            fi
            ;;
        2)
            if install_nodejs_nvm; then
                log_success "Installation completed successfully!"
                log_info "Note: Make sure to run 'source ~/.bashrc' or restart your shell"
            else
                log_error "Installation failed. You may need to install manually."
                exit 1
            fi
            ;;
        3)
            log_info "Installation cancelled"
            exit 0
            ;;
        *)
            log_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    log_success "Node.js installation completed!"
    echo ""
    echo "Now you can run the production build script:"
    echo "  ./build-production-frontend.sh"
    echo ""
    echo "Node.js version: $(node --version)"
    echo "NPM version: $(npm --version)"
fi