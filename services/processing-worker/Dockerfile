FROM node:20-alpine

WORKDIR /app

# Copy shared packages first
COPY shared/ ./shared/

# Copy processing worker package files
COPY services/processing-worker/package*.json ./services/processing-worker/

# Install dependencies for shared packages
RUN cd shared/types && npm install
RUN cd shared/contracts && npm install  
RUN cd shared/utils && npm install

# Install processing worker dependencies
RUN cd services/processing-worker && npm install

# Install development tools globally
RUN npm install -g tsx

# Copy processing worker source code
COPY services/processing-worker/ ./services/processing-worker/

# Build shared packages
RUN cd shared/types && npm run build || true
RUN cd shared/contracts && npm run build || true

# Build the processing worker application (optional for dev)
RUN cd services/processing-worker && npm run build || true

# Set working directory to processing worker
WORKDIR /app/services/processing-worker

# Start the application
CMD ["npm", "run", "start"]