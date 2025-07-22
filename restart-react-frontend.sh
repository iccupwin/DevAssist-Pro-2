#!/bin/bash

echo "🔄 Перезапуск React Frontend"
echo "============================"

echo "🛑 Остановка текущего процесса..."
./stop-react-frontend.sh

echo ""
echo "🚀 Запуск нового процесса..."
./start-react-frontend.sh