FROM node:20-alpine

WORKDIR /app

# Copy shared packages first
COPY shared/ ./shared/

# Copy web package files
COPY web/package*.json ./web/

# Install dependencies for shared packages
RUN cd shared/types && npm install
RUN cd shared/contracts && npm install  

# Install web dependencies
RUN cd web && npm install

# Install development tools globally
RUN npm install -g next

# Copy web source code
COPY web/ ./web/

# Build shared packages
RUN cd shared/types && npm run build || true
RUN cd shared/contracts && npm run build || true

# Build the web application
RUN cd web && npm run build

# Set working directory to web
WORKDIR /app/web

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]