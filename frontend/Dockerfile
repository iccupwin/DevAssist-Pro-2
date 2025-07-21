# Development version для быстрого запуска
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables for Docker
ENV REACT_APP_API_URL=http://46.149.71.162:8000
ENV REACT_APP_WS_URL=ws://46.149.71.162:8000
ENV HOST=0.0.0.0
ENV PORT=3000
ENV WATCHPACK_POLLING=true

# Start development server
CMD ["npm", "start"]