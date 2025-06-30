FROM node:20-alpine

WORKDIR /app

# Copy shared packages first
COPY shared/ ./shared/

# Copy seo worker package files
COPY services/seo-worker/package*.json ./services/seo-worker/

# Install dependencies for shared packages
RUN cd shared/types && npm install
RUN cd shared/contracts && npm install  
RUN cd shared/utils && npm install

# Install seo worker dependencies
RUN cd services/seo-worker && npm install

# Install development tools globally
RUN npm install -g tsx

# Copy seo worker source code
COPY services/seo-worker/ ./services/seo-worker/

# Build shared packages
RUN cd shared/types && npm run build || true
RUN cd shared/contracts && npm run build || true

# Build the seo worker application (optional for dev)
RUN cd services/seo-worker && npm run build || true

# Set working directory to seo worker
WORKDIR /app/services/seo-worker

# Start the application
CMD ["npm", "run", "start"]