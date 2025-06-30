FROM node:20-alpine

WORKDIR /app

# Copy TypeScript config files
COPY tsconfig*.json ./

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

# Ensure TypeScript 4.9.5 is used
RUN cd services/api-gateway && npm install typescript@4.9.5 --save-dev

# Install development tools globally
RUN npm install -g @nestjs/cli tsx

# Copy API Gateway source code
COPY services/api-gateway/ ./services/api-gateway/

# Skip all builds - NestJS dev mode will compile everything on the fly

# Set working directory to API Gateway
WORKDIR /app/services/api-gateway

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Create entrypoint script
RUN printf '#!/bin/sh\n\
# Build shared types if not built\n\
if [ ! -d "../../shared/types/dist" ]; then\n\
  echo "Building shared types..."\n\
  cd ../../shared/types && npm run build\n\
  cd -\n\
fi\n\
# Install missing dependencies if needed\n\
if [ ! -d "node_modules/@elastic/elasticsearch" ]; then\n\
  echo "Installing missing dependencies..."\n\
  npm install\n\
fi\n\
exec "$@"\n' > /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
# Start the application
CMD ["npx", "ts-node", "src/main.ts"]