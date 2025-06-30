#!/bin/bash

# Quick start script for PharmaIQ
# This pre-installs dependencies on the host for faster Docker startup

echo "🚀 PharmaIQ Quick Start Setup"
echo "=============================="

# Install dependencies for shared packages
echo "📦 Installing shared dependencies..."
(cd shared/types && npm install) &
(cd shared/contracts && npm install) &
(cd shared/utils && npm install) &
wait

# Install service dependencies in parallel
echo "📦 Installing service dependencies..."
(cd services/api-gateway && npm install) &
(cd services/ai-worker && npm install) &
(cd services/processing-worker && npm install) &
(cd services/seo-worker && npm install) &
(cd web && npm install) &
wait

echo "✅ Dependencies installed!"
echo ""
echo "🐳 Starting Docker services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ PharmaIQ is starting up!"
echo ""
echo "📍 Access points:"
echo "   - Web Frontend: http://localhost:3000"
echo "   - API Gateway: http://localhost:3001"
echo "   - API Docs: http://localhost:3001/api/docs"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart a service: docker-compose restart <service-name>"
echo ""