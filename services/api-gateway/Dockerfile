FROM node:20-alpine

WORKDIR /app

# Copy shared packages first
COPY shared/ ./shared/

# Copy API Gateway package files
COPY services/api-gateway/package*.json ./services/api-gateway/

# Install dependencies for shared packages
RUN cd shared/types && npm install
RUN cd shared/contracts && npm install  
RUN cd shared/utils && npm install

# Install API Gateway dependencies
RUN cd services/api-gateway && npm install

# Install development tools globally
RUN npm install -g @nestjs/cli tsx

# Copy API Gateway source code
COPY services/api-gateway/ ./services/api-gateway/

# Build shared packages
RUN cd shared/types && npm run build || true
RUN cd shared/contracts && npm run build || true

# Build the API Gateway application (optional for dev)
RUN cd services/api-gateway && npm run build || true

# Set working directory to API Gateway
WORKDIR /app/services/api-gateway

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Create entrypoint script
RUN echo '#!/bin/sh\n\
if [ ! -d "node_modules/@elastic/elasticsearch" ]; then\n\
  echo "Installing missing dependencies..."\n\
  npm install\n\
fi\n\
exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
# Start the application
CMD ["npm", "run", "start"]