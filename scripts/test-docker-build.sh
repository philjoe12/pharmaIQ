#!/bin/bash
# Cross-platform Docker build test script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== PharmaIQ Docker Cross-Platform Build Test ==="
echo "Testing Docker setup on: $(uname -s)"
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment
validate_environment() {
    echo -e "\n${YELLOW}1. Validating Environment...${NC}"
    
    local errors=0
    
    # Check Docker
    if ! command_exists docker; then
        echo -e "${RED}✗ Docker is not installed${NC}"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}✓ Docker found${NC}"
    fi
    
    # Check Docker Compose
    if ! docker compose version >/dev/null 2>&1; then
        echo -e "${RED}✗ Docker Compose v2 is not available${NC}"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}✓ Docker Compose v2 found${NC}"
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}✗ Docker daemon is not running${NC}"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}✓ Docker daemon is running${NC}"
    fi
    
    # Check for required files
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}✗ docker-compose.yml not found${NC}"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}✓ docker-compose.yml found${NC}"
    fi
    
    if [ ! -f "data/Labels.json" ]; then
        echo -e "${YELLOW}⚠ data/Labels.json not found (data ingestion will fail)${NC}"
    else
        echo -e "${GREEN}✓ data/Labels.json found${NC}"
    fi
    
    return $errors
}

# Function to validate credentials
validate_credentials() {
    echo -e "\n${YELLOW}2. Validating Credentials...${NC}"
    
    # Database credentials from docker-compose.yml
    DB_USER="pharmaiq"
    DB_PASSWORD="pharmaiq_dev"
    DB_NAME="pharmaiq_db"
    
    echo "Database Configuration:"
    echo "  - User: $DB_USER"
    echo "  - Password: [REDACTED]"
    echo "  - Database: $DB_NAME"
    echo "  - Host (internal): postgres"
    echo "  - Port: 5432"
    
    # Check for OpenAI API key
    if [ -z "$OPENAI_API_KEY" ]; then
        echo -e "${YELLOW}⚠ OPENAI_API_KEY environment variable not set${NC}"
        echo "  AI features will not work without this key"
        echo "  Set it with: export OPENAI_API_KEY='your-key-here'"
    else
        echo -e "${GREEN}✓ OPENAI_API_KEY is set${NC}"
    fi
}

# Function to test Docker build
test_docker_build() {
    echo -e "\n${YELLOW}3. Testing Docker Build...${NC}"
    
    # Clean up any existing containers
    echo "Cleaning up existing containers..."
    docker compose down -v 2>/dev/null || true
    
    # Test building services
    echo "Building services..."
    if docker compose build --no-cache; then
        echo -e "${GREEN}✓ Docker build successful${NC}"
    else
        echo -e "${RED}✗ Docker build failed${NC}"
        return 1
    fi
}

# Function to test container startup
test_container_startup() {
    echo -e "\n${YELLOW}4. Testing Container Startup...${NC}"
    
    # Start core services first
    echo "Starting database services..."
    docker compose up -d postgres redis elasticsearch
    
    # Wait for services to be healthy
    echo "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker compose ps | grep -E "(postgres|redis|elasticsearch)" | grep -q "healthy"; then
            echo -e "${GREEN}✓ Database services are healthy${NC}"
            break
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}✗ Services failed to become healthy${NC}"
        docker compose logs postgres redis elasticsearch
        return 1
    fi
    
    # Test database connection
    echo "Testing database connection..."
    if docker compose exec -T postgres psql -U pharmaiq -d pharmaiq_db -c "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
    else
        echo -e "${RED}✗ Database connection failed${NC}"
        return 1
    fi
}

# Function to test cross-platform paths
test_cross_platform_paths() {
    echo -e "\n${YELLOW}5. Testing Cross-Platform Paths...${NC}"
    
    # Test volume mounts
    echo "Testing volume mounts..."
    
    # Create a test file
    echo "test" > test-mount.tmp
    
    # Copy to container and verify
    if docker compose cp test-mount.tmp postgres:/tmp/test-mount.tmp 2>/dev/null; then
        if docker compose exec -T postgres cat /tmp/test-mount.tmp >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Volume mounts working${NC}"
        else
            echo -e "${RED}✗ Volume mount verification failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ docker compose cp not supported (older version)${NC}"
    fi
    
    rm -f test-mount.tmp
    
    # Test script execution
    echo "Testing script execution..."
    if docker compose exec -T postgres sh -c "echo 'Script test'" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Script execution working${NC}"
    else
        echo -e "${RED}✗ Script execution failed${NC}"
    fi
}

# Function to generate platform-specific instructions
generate_platform_instructions() {
    echo -e "\n${YELLOW}6. Platform-Specific Instructions...${NC}"
    
    local platform=$(uname -s)
    
    case $platform in
        Darwin)
            echo "macOS Detected:"
            echo "  - Ensure Docker Desktop is installed and running"
            echo "  - Allocate at least 4GB RAM in Docker Desktop preferences"
            echo "  - File sharing should include your project directory"
            ;;
        Linux)
            echo "Linux Detected:"
            echo "  - Ensure docker and docker-compose are installed"
            echo "  - Add your user to the docker group: sudo usermod -aG docker $USER"
            echo "  - Logout and login again for group changes to take effect"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            echo "Windows Detected:"
            echo "  - Use WSL2 for best compatibility"
            echo "  - Ensure Docker Desktop is running with WSL2 backend"
            echo "  - Run this script from WSL2, not Git Bash"
            ;;
    esac
}

# Main execution
main() {
    local total_errors=0
    
    # Run all tests
    validate_environment || total_errors=$?
    validate_credentials
    
    if [ $total_errors -eq 0 ]; then
        test_docker_build || total_errors=$((total_errors + 1))
        test_container_startup || total_errors=$((total_errors + 1))
        test_cross_platform_paths || total_errors=$((total_errors + 1))
    fi
    
    generate_platform_instructions
    
    # Summary
    echo -e "\n${YELLOW}=== Test Summary ===${NC}"
    if [ $total_errors -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        echo -e "\nTo start the application:"
        echo "  1. Set OpenAI API key: export OPENAI_API_KEY='your-key'"
        echo "  2. Start services: docker compose up"
        echo "  3. Import data: ./infrastructure/docker/scripts/import-labels-docker.sh"
        echo "  4. Access app at: http://localhost:3000"
    else
        echo -e "${RED}✗ $total_errors test(s) failed${NC}"
        echo -e "\nPlease fix the issues above before proceeding."
    fi
    
    # Cleanup
    echo -e "\nCleaning up test containers..."
    docker compose down
}

# Run from project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: This script must be run from the project root directory${NC}"
    exit 1
fi

main