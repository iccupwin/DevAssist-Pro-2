#!/bin/bash
# ===========================================
# DevAssist Pro - Automated Server Installation
# ===========================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Функции для вывода
log() {
    echo -e "${BLUE}[INSTALL]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# Проверяем root права
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "Этот скрипт требует root права. Запустите с sudo:"
        echo "sudo $0"
        exit 1
    fi
}

# Определяем операционную систему
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
    else
        error "Не удалось определить операционную систему"
        exit 1
    fi
    
    log "Определена ОС: $OS $VERSION"
}

# Обновляем систему
update_system() {
    log "Обновляем систему..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt update && apt upgrade -y
        apt install -y curl wget git nano htop unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        yum update -y
        yum install -y curl wget git nano htop unzip
    elif [[ "$OS" == *"Fedora"* ]]; then
        dnf update -y
        dnf install -y curl wget git nano htop unzip
    else
        warning "Неизвестная ОС. Попробуем продолжить..."
    fi
    
    success "Система обновлена"
}

# Устанавливаем Docker
install_docker() {
    log "Устанавливаем Docker..."
    
    # Проверяем, установлен ли уже Docker
    if command -v docker &> /dev/null; then
        warning "Docker уже установлен. Версия: $(docker --version)"
        return 0
    fi
    
    # Устанавливаем Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Запускаем и включаем автозапуск
    systemctl start docker
    systemctl enable docker
    
    # Добавляем пользователя в группу docker (если не root)
    if [ -n "$SUDO_USER" ]; then
        usermod -aG docker $SUDO_USER
        log "Пользователь $SUDO_USER добавлен в группу docker"
    fi
    
    success "Docker установлен: $(docker --version)"
}

# Устанавливаем Docker Compose
install_docker_compose() {
    log "Устанавливаем Docker Compose..."
    
    # Проверяем, установлен ли уже
    if command -v docker-compose &> /dev/null; then
        warning "Docker Compose уже установлен. Версия: $(docker-compose --version)"
        return 0
    fi
    
    # Устанавливаем последнюю версию
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Создаем симлинк
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    success "Docker Compose установлен: $(docker-compose --version)"
}

# Настраиваем firewall
configure_firewall() {
    log "Настраиваем firewall..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow ssh
        ufw allow 80
        ufw allow 443
        ufw --force enable
        success "UFW firewall настроен"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL/Fedora
        systemctl start firewalld
        systemctl enable firewalld
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
        success "FirewallD настроен"
    else
        warning "Firewall не найден. Пропускаем настройку."
    fi
}

# Создаем рабочую директорию
create_project_directory() {
    log "Создаем рабочую директорию..."
    
    PROJECT_DIR="/opt/devassist-pro"
    
    # Создаем директорию
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    
    # Создаем пользователя для приложения
    if ! id "devassist" &>/dev/null; then
        useradd -r -s /bin/false -m -d /opt/devassist-pro devassist
        log "Создан пользователь devassist"
    fi
    
    # Создаем структуру директорий
    mkdir -p data/{postgres,redis,app,logs}
    mkdir -p data/app/{uploads,reports,cache}
    
    # Устанавливаем права
    chown -R devassist:devassist $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
    
    success "Рабочая директория создана: $PROJECT_DIR"
}

# Загружаем код проекта
download_project() {
    log "Загружаем код проекта..."
    
    cd /opt/devassist-pro
    
    # Запрашиваем способ загрузки
    echo ""
    info "Выберите способ загрузки кода:"
    echo "1) Git репозиторий (рекомендуется)"
    echo "2) Загрузка архива"
    echo "3) Пропустить (код уже загружен)"
    echo ""
    read -p "Введите номер (1-3): " choice
    
    case $choice in
        1)
            read -p "Введите URL Git репозитория: " git_url
            if [ -n "$git_url" ]; then
                git clone "$git_url" temp_repo
                cp -r temp_repo/* .
                rm -rf temp_repo
                success "Код загружен из Git репозитория"
            else
                error "URL не указан"
                exit 1
            fi
            ;;
        2)
            read -p "Введите URL архива: " archive_url
            if [ -n "$archive_url" ]; then
                wget "$archive_url" -O project.zip
                unzip project.zip
                # Найти директорию с кодом и переместить файлы
                find . -maxdepth 2 -name "*.sh" -exec cp {} . \;
                find . -maxdepth 2 -name "docker-compose*.yml" -exec cp {} . \;
                find . -maxdepth 2 -name "Dockerfile*" -exec cp {} . \;
                find . -maxdepth 2 -name "*.md" -exec cp {} . \;
                rm -f project.zip
                success "Код загружен из архива"
            else
                error "URL не указан"
                exit 1
            fi
            ;;
        3)
            warning "Пропускаем загрузку кода"
            ;;
        *)
            error "Неверный выбор"
            exit 1
            ;;
    esac
    
    # Устанавливаем права на скрипты
    chmod +x *.sh 2>/dev/null || true
    chown -R devassist:devassist /opt/devassist-pro
}

# Настраиваем environment
configure_environment() {
    log "Настраиваем environment переменные..."
    
    cd /opt/devassist-pro
    
    if [ ! -f ".env.fullstack.example" ]; then
        error ".env.fullstack.example не найден. Убедитесь, что код загружен правильно."
        exit 1
    fi
    
    # Копируем пример
    cp .env.fullstack.example .env
    
    # Генерируем безопасные ключи
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASS=$(openssl rand -base64 16 | tr -d '/+' | head -c 16)
    REDIS_PASS=$(openssl rand -base64 16 | tr -d '/+' | head -c 16)
    
    # Обновляем .env файл
    sed -i "s/your-super-secret-jwt-key-minimum-32-characters-long/$JWT_SECRET/" .env
    sed -i "s/your-super-secret-session-key-minimum-32-characters-long/$SESSION_SECRET/" .env
    sed -i "s/your_super_secure_postgres_password_here/$POSTGRES_PASS/" .env
    sed -i "s/your_super_secure_redis_password_here/$REDIS_PASS/" .env
    
    # Запрашиваем API ключи
    echo ""
    info "Настройка API ключей:"
    echo ""
    
    # Anthropic API ключ (обязательный)
    while true; do
        read -p "Введите Anthropic API ключ (sk-ant-api03-...): " anthropic_key
        if [[ $anthropic_key == sk-ant-api03-* ]]; then
            sed -i "s/sk-ant-api03-your-anthropic-api-key-here/$anthropic_key/" .env
            break
        else
            error "Неверный формат ключа Anthropic. Ключ должен начинаться с 'sk-ant-api03-'"
        fi
    done
    
    # OpenAI API ключ (опционально)
    read -p "Введите OpenAI API ключ (опционально, Enter для пропуска): " openai_key
    if [ -n "$openai_key" ]; then
        sed -i "s/sk-your-openai-api-key-here/$openai_key/" .env
    fi
    
    # Домен
    read -p "Введите ваш домен (например, yourdomain.com, Enter для localhost): " domain
    if [ -n "$domain" ]; then
        sed -i "s/yourdomain.com/$domain/g" .env
        sed -i "s/localhost/$domain/g" .env
    fi
    
    success "Environment настроен"
}

# Устанавливаем systemd service
install_systemd_service() {
    log "Настраиваем systemd service..."
    
    cat > /etc/systemd/system/devassist-pro.service << EOF
[Unit]
Description=DevAssist Pro Fullstack Application
Documentation=https://github.com/your-repo/DevAssist-Pro
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=root
Group=root
WorkingDirectory=/opt/devassist-pro
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

ExecStart=/opt/devassist-pro/start-fullstack.sh
ExecStop=/opt/devassist-pro/stop-fullstack.sh
ExecReload=/bin/bash -c '/opt/devassist-pro/stop-fullstack.sh && /opt/devassist-pro/start-fullstack.sh'

TimeoutStartSec=300
TimeoutStopSec=120

StandardOutput=journal
StandardError=journal
SyslogIdentifier=devassist-pro

[Install]
WantedBy=multi-user.target
EOF

    # Перезагружаем systemd и включаем service
    systemctl daemon-reload
    systemctl enable devassist-pro
    
    success "Systemd service установлен и активирован"
}

# Настраиваем мониторинг
setup_monitoring() {
    log "Настраиваем мониторинг..."
    
    # Health check скрипт
    cat > /usr/local/bin/devassist-health-check.sh << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/devassist-health.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[$DATE] $1" | tee -a $LOG_FILE
}

if ! docker-compose -f /opt/devassist-pro/docker-compose.fullstack.yml ps | grep -q "Up"; then
    log "ERROR: DevAssist Pro containers are not running"
    systemctl restart devassist-pro
    exit 1
fi

if ! curl -f -s http://localhost:80/health > /dev/null; then
    log "ERROR: DevAssist Pro HTTP health check failed"
    exit 1
fi

log "SUCCESS: All health checks passed"
EOF

    chmod +x /usr/local/bin/devassist-health-check.sh
    
    # Добавляем в cron
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/devassist-health-check.sh") | crontab -
    (crontab -l 2>/dev/null; echo "0 2 * * * docker system prune -f") | crontab -
    
    success "Мониторинг настроен"
}

# Запускаем систему
start_system() {
    log "Запускаем DevAssist Pro..."
    
    cd /opt/devassist-pro
    
    # Проверяем наличие необходимых файлов
    if [ ! -f "start-fullstack.sh" ]; then
        error "start-fullstack.sh не найден. Проверьте загрузку кода."
        exit 1
    fi
    
    if [ ! -f "docker-compose.fullstack.yml" ]; then
        error "docker-compose.fullstack.yml не найден. Проверьте загрузку кода."
        exit 1
    fi
    
    # Запускаем через systemd
    systemctl start devassist-pro
    
    # Ждем запуска
    log "Ожидаем запуска системы..."
    sleep 30
    
    # Проверяем статус
    if systemctl is-active devassist-pro > /dev/null; then
        success "DevAssist Pro успешно запущен!"
    else
        error "Не удалось запустить DevAssist Pro"
        systemctl status devassist-pro
        exit 1
    fi
}

# Финальная проверка
final_check() {
    log "Выполняем финальную проверку..."
    
    # Проверяем HTTP доступность
    sleep 10
    if curl -f -s http://localhost:80/health > /dev/null; then
        success "HTTP health check прошел"
    else
        error "HTTP health check не прошел"
        return 1
    fi
    
    # Проверяем API
    if curl -f -s http://localhost:80/api/health > /dev/null; then
        success "API health check прошел"
    else
        warning "API health check не прошел (возможно, нужно время для запуска)"
    fi
    
    # Запускаем тесты если доступны
    if [ -f "/opt/devassist-pro/test-fullstack.sh" ]; then
        log "Запускаем автоматические тесты..."
        cd /opt/devassist-pro
        ./test-fullstack.sh || warning "Некоторые тесты не прошли"
    fi
    
    return 0
}

# Показываем итоговую информацию
show_final_info() {
    echo ""
    echo "======================================"
    success "🎉 УСТАНОВКА ЗАВЕРШЕНА УСПЕШНО!"
    echo "======================================"
    echo ""
    info "DevAssist Pro установлен и запущен!"
    echo ""
    echo "📊 Доступные URL:"
    
    # Определяем внешний IP
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "YOUR_SERVER_IP")
    
    echo "   • HTTP:  http://$EXTERNAL_IP"
    echo "   • Health: http://$EXTERNAL_IP/health"
    echo "   • API:    http://$EXTERNAL_IP/api/docs"
    echo ""
    echo "🔧 Управление системой:"
    echo "   • Статус:     sudo systemctl status devassist-pro"
    echo "   • Запуск:     sudo systemctl start devassist-pro"
    echo "   • Остановка:  sudo systemctl stop devassist-pro"
    echo "   • Перезапуск: sudo systemctl restart devassist-pro"
    echo "   • Логи:       sudo journalctl -u devassist-pro -f"
    echo ""
    echo "📁 Файлы проекта: /opt/devassist-pro"
    echo "📋 Конфигурация: /opt/devassist-pro/.env"
    echo ""
    echo "🔍 Мониторинг:"
    echo "   • Health check: /usr/local/bin/devassist-health-check.sh"
    echo "   • Логи мониторинга: /var/log/devassist-health.log"
    echo ""
    warning "ВАЖНО: Сохраните файл .env с вашими настройками!"
    echo ""
}

# Главная функция
main() {
    echo ""
    echo "======================================"
    log "🚀 DevAssist Pro - Автоматическая установка на сервер"
    echo "======================================"
    echo ""
    
    # Проверки и подготовка
    check_root
    detect_os
    
    # Установка компонентов
    update_system
    install_docker
    install_docker_compose
    configure_firewall
    
    # Настройка проекта
    create_project_directory
    download_project
    configure_environment
    
    # Системные сервисы
    install_systemd_service
    setup_monitoring
    
    # Запуск и проверка
    start_system
    
    if final_check; then
        show_final_info
    else
        error "Установка завершена с ошибками. Проверьте логи:"
        echo "sudo journalctl -u devassist-pro -f"
    fi
}

# Запускаем установку
main "$@"