#!/bin/bash

# Simple Streamlit Runner for DevAssist Pro

echo "🚀 Starting DevAssist Pro Streamlit Application..."

# Create a simple Docker container for Streamlit
docker run --rm -d \
  --name devassist-streamlit \
  -p 8501:8501 \
  -v "$(pwd):/app" \
  -w /app \
  -e ANTHROPIC_API_KEY="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" \
  python:3.11-slim \
  bash -c "
    pip install -r requirements.txt && 
    streamlit run app.py --server.port=8501 --server.address=0.0.0.0 --server.headless=true
  "

echo "✅ Streamlit application is starting..."
echo "🌐 Access it at: http://localhost:8501"
echo ""
echo "📊 To check logs: docker logs -f devassist-streamlit"
echo "🛑 To stop: docker stop devassist-streamlit"
echo ""
echo "Waiting for application to start..."

# Wait for application to start
sleep 5

# Check if container is running
if docker ps | grep -q devassist-streamlit; then
    echo "✅ Application is running!"
    echo "📱 Open http://localhost:8501 in your browser"
else
    echo "❌ Application failed to start. Check logs:"
    docker logs devassist-streamlit
fi