FROM node:20-alpine

WORKDIR /app

# Copy shared packages first
COPY shared/ ./shared/

# Copy ai worker package files
COPY services/ai-worker/package*.json ./services/ai-worker/

# Install dependencies for shared packages
RUN cd shared/types && npm install
RUN cd shared/contracts && npm install  
RUN cd shared/utils && npm install

# Install ai worker dependencies
RUN cd services/ai-worker && npm install

# Install development tools globally
RUN npm install -g tsx

# Copy ai worker source code
COPY services/ai-worker/ ./services/ai-worker/

# Build shared packages
RUN cd shared/types && npm run build || true
RUN cd shared/contracts && npm run build || true

# Build the ai worker application (optional for dev)
RUN cd services/ai-worker && npm run build || true

# Set working directory to ai worker
WORKDIR /app/services/ai-worker

# Start the application
CMD ["npm", "run", "start"]