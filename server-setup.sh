#!/bin/bash

# Server Setup Script for Ubuntu
echo "🔧 Подготовка Ubuntu сервера для DevAssist Pro"
echo "==============================================="

# Update system
echo "📦 Обновление системы..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "📦 Установка необходимых пакетов..."
sudo apt install -y curl wget git nano htop unzip

# Install Docker
echo "🐳 Установка Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker установлен"
else
    echo "✅ Docker уже установлен"
fi

# Install Docker Compose
echo "🔧 Установка Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose установлен"
else
    echo "✅ Docker Compose уже установлен"
fi

# Install Node.js (for frontend development)
echo "📦 Установка Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js установлен"
else
    echo "✅ Node.js уже установлен"
fi

# Configure firewall
echo "🔒 Настройка файрвола..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # React Frontend
sudo ufw allow 8501/tcp  # Streamlit Backend
sudo ufw allow 5432/tcp  # PostgreSQL
sudo ufw --force enable

# Show versions
echo ""
echo "📋 Установленные версии:"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

echo ""
echo "✅ Сервер подготовлен!"
echo "🔄 Перезагрузите сервер: sudo reboot"
echo "📁 Затем клонируйте проект и запустите: ./deploy-server.sh"