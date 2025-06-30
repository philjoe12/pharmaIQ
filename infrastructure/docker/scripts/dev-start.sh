#!/bin/bash

# PharmaIQ Development Environment Startup Script
# This script ensures proper dependency management with Docker volumes

set -e

echo "🚀 Starting PharmaIQ Development Environment"

# Change to the docker directory
cd "$(dirname "$0")/.."

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker and try again."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to clean up old containers and volumes if needed
cleanup_if_needed() {
    if [ "$1" = "--clean" ]; then
        echo "🧹 Cleaning up old containers and volumes..."
        docker-compose down -v
        docker volume prune -f
        echo "✅ Cleanup complete"
    fi
}

# Function to build containers
build_containers() {
    echo "🔨 Building containers..."
    docker-compose build --no-cache
    echo "✅ Containers built successfully"
}

# Function to initialize volumes with dependencies
initialize_volumes() {
    echo "📦 Initializing dependency volumes..."
    
    # Create temporary containers to populate volumes
    echo "  Installing API Gateway dependencies..."
    docker-compose run --rm --no-deps api-gateway npm install
    
    echo "  Installing Processing Worker dependencies..."
    docker-compose run --rm --no-deps processing-worker npm install
    
    echo "  Installing AI Worker dependencies..."
    docker-compose run --rm --no-deps ai-worker npm install
    
    echo "  Installing SEO Worker dependencies..."
    docker-compose run --rm --no-deps seo-worker npm install
    
    echo "  Installing Web dependencies..."
    docker-compose run --rm --no-deps web npm install
    
    echo "  Installing shared dependencies..."
    docker-compose run --rm --no-deps api-gateway sh -c "cd /app/shared/types && npm install"
    docker-compose run --rm --no-deps api-gateway sh -c "cd /app/shared/contracts && npm install"
    docker-compose run --rm --no-deps api-gateway sh -c "cd /app/shared/utils && npm install"
    
    echo "✅ Dependency volumes initialized"
}

# Function to start services
start_services() {
    echo "🚀 Starting development services..."
    docker-compose up -d
    echo "✅ Services started"
}

# Function to show status
show_status() {
    echo "📊 Service Status:"
    docker-compose ps
    
    echo ""
    echo "🌐 Available Services:"
    echo "  - Web Frontend: http://localhost:3000"
    echo "  - API Gateway: http://localhost:3001"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    
    echo ""
    echo "📋 Useful Commands:"
    echo "  - View logs: docker-compose logs -f [service-name]"
    echo "  - Stop services: docker-compose down"
    echo "  - Restart service: docker-compose restart [service-name]"
    echo "  - Shell into container: docker-compose exec [service-name] sh"
}

# Function to wait for services to be healthy
wait_for_services() {
    echo "⏳ Waiting for services to be healthy..."
    
    # Wait for database
    echo "  Waiting for PostgreSQL..."
    until docker-compose exec postgres pg_isready -U pharmaiq > /dev/null 2>&1; do
        sleep 1
    done
    
    # Wait for Redis
    echo "  Waiting for Redis..."
    until docker-compose exec redis redis-cli ping > /dev/null 2>&1; do
        sleep 1
    done
    
    echo "✅ Core services are healthy"
}

# Main execution
main() {
    check_docker
    cleanup_if_needed "$1"
    
    # Check if volumes exist and are populated
    if [ "$1" = "--init" ] || [ "$1" = "--clean" ] || ! docker volume ls | grep -q "api-gateway-node-modules"; then
        build_containers
        initialize_volumes
    fi
    
    start_services
    wait_for_services
    show_status
    
    echo ""
    echo "🎉 Development environment is ready!"
    echo "💡 Run './dev-start.sh --help' for options"
}

# Help function
show_help() {
    echo "PharmaIQ Development Environment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --init    Force initialization of dependency volumes"
    echo "  --clean   Clean up all volumes and containers before starting"
    echo "  --help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                Start development environment"
    echo "  $0 --init         Force rebuild and initialize"
    echo "  $0 --clean        Clean and restart everything"
}

# Handle arguments
case "$1" in
    --help)
        show_help
        ;;
    *)
        main "$1"
        ;;
esac