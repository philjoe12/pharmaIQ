FROM node:20-alpine

WORKDIR /app

# Copy everything - shared types are just files now
COPY . .

# Install dependencies
WORKDIR /app/services/api-gateway
RUN npm install

EXPOSE 3001

CMD ["npm", "run", "start:dev"]