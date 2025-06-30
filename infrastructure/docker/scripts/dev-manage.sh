#!/bin/bash

# PharmaIQ Development Environment Management Script
# Utilities for managing the development environment

set -e

cd "$(dirname "$0")/.."

# Function to sync dependencies from host to containers
sync_dependencies() {
    echo "🔄 Syncing dependencies from host to containers..."
    
    # Check if local node_modules exist
    local services=("web" "services/api-gateway" "services/processing-worker" "services/ai-worker" "services/seo-worker")
    local shared=("shared/types" "shared/contracts" "shared/utils")
    
    for service in "${services[@]}"; do
        if [ -d "../../$service/node_modules" ]; then
            echo "  Syncing $service dependencies..."
            docker-compose run --rm --no-deps $(basename $service) sh -c "
                rm -rf /app/$service/node_modules
                cp -r /host-node-modules/$service/node_modules /app/$service/
            " -v "$PWD/../../$service/node_modules:/host-node-modules/$service/node_modules"
        fi
    done
    
    for shared_pkg in "${shared[@]}"; do
        if [ -d "../../$shared_pkg/node_modules" ]; then
            echo "  Syncing $shared_pkg dependencies..."
            docker-compose run --rm --no-deps api-gateway sh -c "
                rm -rf /app/$shared_pkg/node_modules
                cp -r /host-node-modules/$shared_pkg/node_modules /app/$shared_pkg/
            " -v "$PWD/../../$shared_pkg/node_modules:/host-node-modules/$shared_pkg/node_modules"
        fi
    done
    
    echo "✅ Dependencies synced"
}

# Function to rebuild specific service
rebuild_service() {
    local service=$1
    if [ -z "$service" ]; then
        echo "❌ Please specify a service to rebuild"
        echo "Available services: api-gateway, processing-worker, ai-worker, seo-worker, web"
        exit 1
    fi
    
    echo "🔨 Rebuilding $service..."
    docker-compose stop "$service"
    docker-compose build --no-cache "$service"
    docker-compose run --rm --no-deps "$service" npm install
    docker-compose up -d "$service"
    echo "✅ $service rebuilt and restarted"
}

# Function to install new dependency
install_dependency() {
    local service=$1
    local package=$2
    
    if [ -z "$service" ] || [ -z "$package" ]; then
        echo "❌ Usage: $0 install <service> <package>"
        echo "Example: $0 install api-gateway @types/node"
        exit 1
    fi
    
    echo "📦 Installing $package in $service..."
    docker-compose exec "$service" npm install "$package"
    echo "✅ $package installed in $service"
}

# Function to run tests
run_tests() {
    local service=$1
    
    if [ -z "$service" ]; then
        echo "🧪 Running tests for all services..."
        docker-compose exec api-gateway npm test
        docker-compose exec processing-worker npm test
        docker-compose exec ai-worker npm test
        docker-compose exec seo-worker npm test
        docker-compose exec web npm test
    else
        echo "🧪 Running tests for $service..."
        docker-compose exec "$service" npm test
    fi
}

# Function to view logs
view_logs() {
    local service=$1
    
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# Function to get shell access
shell_access() {
    local service=$1
    
    if [ -z "$service" ]; then
        echo "❌ Please specify a service for shell access"
        echo "Available services: api-gateway, processing-worker, ai-worker, seo-worker, web, postgres, redis"
        exit 1
    fi
    
    echo "🐚 Opening shell in $service..."
    docker-compose exec "$service" sh
}

# Function to reset volumes
reset_volumes() {
    echo "🗑️  Resetting all development volumes..."
    docker-compose down -v
    docker volume prune -f
    echo "✅ Volumes reset. Run dev-start.sh --init to reinitialize"
}

# Function to check health
check_health() {
    echo "🏥 Checking service health..."
    
    echo "📊 Container Status:"
    docker-compose ps
    
    echo ""
    echo "🔌 Service Endpoints:"
    
    # Check web
    if curl -s http://localhost:3000 > /dev/null; then
        echo "  ✅ Web Frontend (http://localhost:3000)"
    else
        echo "  ❌ Web Frontend (http://localhost:3000)"
    fi
    
    # Check API Gateway
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "  ✅ API Gateway (http://localhost:3001)"
    else
        echo "  ❌ API Gateway (http://localhost:3001)"
    fi
    
    # Check PostgreSQL
    if docker-compose exec postgres pg_isready -U pharmaiq > /dev/null 2>&1; then
        echo "  ✅ PostgreSQL (localhost:5432)"
    else
        echo "  ❌ PostgreSQL (localhost:5432)"
    fi
    
    # Check Redis
    if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
        echo "  ✅ Redis (localhost:6379)"
    else
        echo "  ❌ Redis (localhost:6379)"
    fi
}

# Help function
show_help() {
    echo "PharmaIQ Development Environment Management"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  sync              Sync dependencies from host to containers"
    echo "  rebuild <service> Rebuild and restart a specific service"
    echo "  install <service> <package> Install a new package in service"
    echo "  test [service]    Run tests (all services or specific)"
    echo "  logs [service]    View logs (all services or specific)"
    echo "  shell <service>   Get shell access to a service"
    echo "  reset             Reset all volumes and containers"
    echo "  health            Check health of all services"
    echo "  help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 rebuild api-gateway"
    echo "  $0 install web next@latest"
    echo "  $0 test api-gateway"
    echo "  $0 logs web"
    echo "  $0 shell api-gateway"
}

# Main execution
case "$1" in
    sync)
        sync_dependencies
        ;;
    rebuild)
        rebuild_service "$2"
        ;;
    install)
        install_dependency "$2" "$3"
        ;;
    test)
        run_tests "$2"
        ;;
    logs)
        view_logs "$2"
        ;;
    shell)
        shell_access "$2"
        ;;
    reset)
        reset_volumes
        ;;
    health)
        check_health
        ;;
    help|--help)
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Run '$0 help' for available commands"
        exit 1
        ;;
esac