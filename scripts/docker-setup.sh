#!/bin/bash
# Cross-platform Docker setup script for PharmaIQ
# Works with both docker-compose v1 and v2
#
# Usage:
#   ./docker-setup.sh                   # Interactive mode
#   ./docker-setup.sh --full            # Non-interactive full setup
#   ./docker-setup.sh --services-only   # Start services only
#   ./docker-setup.sh --database-only   # Initialize database only
#   ./docker-setup.sh --help            # Show help

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
MODE=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            MODE="full"
            shift
            ;;
        --services-only)
            MODE="services"
            shift
            ;;
        --database-only)
            MODE="database"
            shift
            ;;
        --help|-h)
            echo "PharmaIQ Docker Setup Script"
            echo ""
            echo "Usage:"
            echo "  $0                   # Interactive mode with menu"
            echo "  $0 --full            # Non-interactive full setup"
            echo "  $0 --services-only   # Start Docker services only"
            echo "  $0 --database-only   # Initialize database only"
            echo "  $0 --help            # Show this help"
            echo ""
            echo "Supported platforms:"
            echo "  - Linux: Ubuntu 20.04+, RHEL/CentOS 8+, Debian 10+"
            echo "  - macOS: 11+ (Intel & Apple Silicon)"
            echo "  - Windows: WSL2 with Docker Desktop"
            echo ""
            echo "Architecture support:"
            echo "  - x86_64 (Intel/AMD)"
            echo "  - ARM64 (Apple Silicon/AWS Graviton)"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Detect docker-compose command
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
    COMPOSE_VERSION="v2"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
    COMPOSE_VERSION="v1"
else
    echo -e "${RED}Error: Neither 'docker compose' nor 'docker-compose' found!${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${BLUE}=== PharmaIQ Docker Setup ===${NC}"
echo -e "Platform: $(uname -s) ($(uname -m))"
echo -e "Docker: $(docker --version)"
echo -e "Docker Compose: $COMPOSE_VERSION (using: $DOCKER_COMPOSE)"

# Architecture check
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    echo -e "Architecture: ARM64 (Apple Silicon/AWS Graviton)"
elif [ "$ARCH" = "x86_64" ]; then
    echo -e "Architecture: x86_64 (Intel/AMD)"
else
    echo -e "${YELLOW}Architecture: $ARCH (untested)${NC}"
fi
echo ""

# Function to run docker-compose commands
dc() {
    $DOCKER_COMPOSE "$@"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    local errors=0
    
    # Check Docker
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}✗ Docker daemon is not running${NC}"
        
        case "$(uname -s)" in
            Darwin)
                echo "  → Start Docker Desktop for Mac"
                ;;
            Linux)
                echo "  → Run: sudo systemctl start docker"
                echo "  → If permission denied: sudo usermod -aG docker $USER && newgrp docker"
                ;;
        esac
        ((errors++))
    else
        echo -e "${GREEN}✓ Docker daemon running${NC}"
        
        # Platform-specific Docker checks
        case "$(uname -s)" in
            Darwin)
                # Check macOS Docker Desktop settings
                if docker info | grep -q "Operating System:.*Docker Desktop"; then
                    echo -e "${GREEN}✓ Docker Desktop detected${NC}"
                    # Check for performance settings
                    if docker info 2>/dev/null | grep -q "virtiofs"; then
                        echo -e "${GREEN}✓ VirtioFS enabled (optimal performance)${NC}"
                    else
                        echo -e "${YELLOW}⚠ Consider enabling VirtioFS for better performance${NC}"
                        echo "  → Docker Desktop > Settings > General > Use VirtioFS"
                    fi
                fi
                ;;
            Linux)
                # Check for SELinux
                if command -v getenforce >/dev/null 2>&1 && [ "$(getenforce)" != "Disabled" ]; then
                    echo -e "${YELLOW}⚠ SELinux is enabled${NC}"
                    echo "  → Volume mounts may need :z or :Z flags"
                    echo "  → If you encounter permission errors, we'll handle them"
                fi
                
                # Check if running in WSL2
                if grep -qi microsoft /proc/version 2>/dev/null; then
                    echo -e "${BLUE}ℹ WSL2 environment detected${NC}"
                    echo "  → Make sure Docker Desktop is running on Windows"
                fi
                ;;
        esac
    fi
    
    # Check files
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}✗ docker-compose.yml not found${NC}"
        echo "  → Run this script from the project root directory"
        ((errors++))
    else
        echo -e "${GREEN}✓ docker-compose.yml found${NC}"
    fi
    
    if [ ! -f "data/Labels.json" ]; then
        echo -e "${YELLOW}⚠ data/Labels.json not found${NC}"
        echo "  → Drug import will fail without this file"
    else
        echo -e "${GREEN}✓ data/Labels.json found${NC}"
    fi
    
    # Check .env
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠ .env file not found${NC}"
        echo "  → Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${GREEN}  ✓ Created .env file${NC}"
        else
            echo -e "${RED}  ✗ .env.example not found${NC}"
            ((errors++))
        fi
    else
        echo -e "${GREEN}✓ .env file exists${NC}"
    fi
    
    # Check OpenAI key
    if [ -f ".env" ]; then
        if grep -q "OPENAI_API_KEY=your-openai-api-key-here" .env || ! grep -q "OPENAI_API_KEY=sk-" .env; then
            echo -e "${YELLOW}⚠ OPENAI_API_KEY not configured in .env${NC}"
            echo "  → AI features will not work"
            echo "  → Edit .env and add your OpenAI API key"
        else
            echo -e "${GREEN}✓ OPENAI_API_KEY appears to be set${NC}"
        fi
    fi
    
    # Check image architecture compatibility
    echo -e "\n${YELLOW}Checking Docker image compatibility...${NC}"
    local arch_compatible=true
    for image in node:20-alpine pgvector/pgvector:pg15 redis:7-alpine elasticsearch:8.11.0; do
        if docker manifest inspect $image >/dev/null 2>&1; then
            if docker manifest inspect $image 2>/dev/null | grep -q "$(uname -m)\|$(dpkg --print-architecture 2>/dev/null || echo $ARCH)"; then
                echo -e "${GREEN}✓ $image supports $(uname -m)${NC}"
            else
                echo -e "${RED}✗ $image may not support $(uname -m)${NC}"
                arch_compatible=false
            fi
        fi
    done
    
    if [ "$arch_compatible" = false ]; then
        echo -e "${YELLOW}⚠ Some images may not support your architecture${NC}"
        echo "  → The services may fail to start or run slowly under emulation"
    fi
    
    return $errors
}

# Function to fix permissions (Linux specific)
fix_linux_permissions() {
    if [ "$(uname -s)" = "Linux" ]; then
        echo -e "\n${YELLOW}Checking Linux permissions...${NC}"
        
        if ! groups | grep -q docker; then
            echo -e "${YELLOW}You're not in the docker group${NC}"
            echo "Run these commands to fix:"
            echo -e "${BLUE}sudo usermod -aG docker $USER${NC}"
            echo -e "${BLUE}newgrp docker${NC}"
            echo "Or logout and login again"
            return 1
        else
            echo -e "${GREEN}✓ User is in docker group${NC}"
        fi
    fi
    return 0
}

# Function to start services
start_services() {
    echo -e "\n${YELLOW}Starting Docker services...${NC}"
    
    # Stop any existing containers
    echo "Cleaning up existing containers..."
    dc down >/dev/null 2>&1 || true
    
    # Start core services
    echo "Starting database services..."
    dc up -d postgres redis elasticsearch
    
    # Wait for services to be ready
    echo -n "Waiting for services to be healthy"
    local max_wait=60
    local waited=0
    
    while [ $waited -lt $max_wait ]; do
        if dc ps | grep -E "(postgres|redis|elasticsearch)" | grep -q "Up"; then
            echo -e "\n${GREEN}✓ Services are up${NC}"
            break
        fi
        echo -n "."
        sleep 2
        ((waited+=2))
    done
    
    if [ $waited -ge $max_wait ]; then
        echo -e "\n${RED}✗ Services failed to start${NC}"
        dc logs postgres redis elasticsearch
        return 1
    fi
    
    # Additional health check for postgres
    echo "Testing database connection..."
    if dc exec -T postgres pg_isready -U pharmaiq >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
    else
        echo -e "${RED}✗ PostgreSQL not ready${NC}"
        return 1
    fi
    
    # Start remaining services
    echo "Starting application services..."
    dc up -d
    
    return 0
}

# Function to import drug data
import_drug_data() {
    echo -e "\n${YELLOW}Importing drug data...${NC}"
    
    # First check if table exists
    if ! dc exec -T postgres psql -U pharmaiq -d pharmaiq_db -c '\dt drugs' 2>/dev/null | grep -q "drugs"; then
        echo -e "${YELLOW}Database tables not initialized. Running TypeORM migrations...${NC}"
        # Run TypeORM migrations
        if dc exec -T api sh -c "cd /app/services/api-gateway && npm run migration:run" 2>&1 | grep -E "(executed|already|successfully)"; then
            echo -e "${GREEN}✓ Database schema created via TypeORM migrations${NC}"
        else
            echo -e "${RED}✗ Failed to run migrations${NC}"
            echo -e "${YELLOW}Attempting to install dependencies and retry...${NC}"
            dc exec -T api sh -c "cd /app/services/api-gateway && npm install" >/dev/null 2>&1
            if dc exec -T api sh -c "cd /app/services/api-gateway && npm run migration:run"; then
                echo -e "${GREEN}✓ Database schema created via TypeORM migrations${NC}"
            else
                echo -e "${RED}✗ Failed to create database schema${NC}"
                return 1
            fi
        fi
    fi
    
    # Check if data exists
    if dc exec -T postgres psql -U pharmaiq -d pharmaiq_db -t -c "SELECT COUNT(*) FROM drugs;" 2>/dev/null | grep -q "0"; then
        echo -e "${YELLOW}No drug data found. Will import...${NC}"
    else
        local count=$(dc exec -T postgres psql -U pharmaiq -d pharmaiq_db -t -c "SELECT COUNT(*) FROM drugs;" 2>/dev/null | tr -d ' ')
        if [ -n "$count" ] && [ "$count" -gt 0 ]; then
            echo -e "${GREEN}✓ Database already contains $count drugs${NC}"
            read -p "Do you want to re-import? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                return 0
            fi
        fi
    fi
    
    # Install pg module if needed
    echo "Installing required Node modules..."
    dc exec -T api npm install pg >/dev/null 2>&1
    
    # Run import script
    echo "Running import script..."
    if dc exec -T api node /app/infrastructure/docker/scripts/import-labels.js; then
        echo -e "${GREEN}✓ Drug data imported successfully${NC}"
        
        # Show sample drugs
        echo -e "\n${BLUE}Sample imported drugs:${NC}"
        dc exec -T postgres psql -U pharmaiq -d pharmaiq_db -t -c "SELECT drug_name, slug FROM drugs LIMIT 5;"
    else
        echo -e "${RED}✗ Import failed${NC}"
        return 1
    fi
}

# Function to show setup menu
show_setup_menu() {
    echo -e "\n${BLUE}=== PharmaIQ Setup Options ===${NC}"
    echo -e "\nPlease select your setup preference:"
    echo -e "  ${GREEN}1)${NC} Full Setup (Recommended) - Start services + Initialize database + Import sample data"
    echo -e "  ${GREEN}2)${NC} Services Only - Start Docker services without database setup"
    echo -e "  ${GREEN}3)${NC} Database Only - Initialize database and import data (services must be running)"
    echo -e "  ${GREEN}4)${NC} Custom Setup - Choose each step individually"
    echo -e "  ${GREEN}5)${NC} Exit"
    echo ""
    read -p "Enter your choice (1-5): " choice
    return $choice
}

# Function for custom setup
custom_setup() {
    local start_services=false
    local init_db=false
    local import_data=false
    
    echo -e "\n${BLUE}=== Custom Setup Options ===${NC}"
    
    read -p "Start Docker services? (Y/n) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]] && start_services=true
    
    read -p "Initialize database schema? (Y/n) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]] && init_db=true
    
    read -p "Import sample drug data? (Y/n) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]] && import_data=true
    
    echo ""
    if $start_services; then
        start_services || return 1
    fi
    
    if $init_db || $import_data; then
        if $import_data; then
            import_drug_data
        else
            # Just init database without importing
            echo -e "\n${YELLOW}Initializing database schema only...${NC}"
            if ! dc exec -T postgres psql -U pharmaiq -d pharmaiq_db -c '\dt drugs' 2>/dev/null | grep -q "drugs"; then
                if dc exec -T api sh -c "cd /app/services/api-gateway && npm run migration:run"; then
                    echo -e "${GREEN}✓ Database schema created via TypeORM migrations${NC}"
                else
                    echo -e "${RED}✗ Failed to create database schema${NC}"
                    return 1
                fi
            else
                echo -e "${GREEN}✓ Database schema already exists${NC}"
            fi
        fi
    fi
    
    return 0
}

# Main setup flow
main() {
    echo -e "${BLUE}=== PharmaIQ Docker Setup ===${NC}"
    echo -e "Platform: $(uname -s) ($(uname -m))"
    echo -e "Environment: ${ENVIRONMENT:-development}"
    
    # Check prerequisites
    if ! check_prerequisites; then
        echo -e "\n${RED}Please fix the issues above before continuing${NC}"
        exit 1
    fi
    
    # Linux-specific checks
    if ! fix_linux_permissions; then
        echo -e "\n${YELLOW}Fix permissions and run this script again${NC}"
        exit 1
    fi
    
    # Handle non-interactive mode if specified
    if [ -n "$MODE" ]; then
        case $MODE in
            "full")
                echo -e "\n${GREEN}Running non-interactive full setup...${NC}"
                if start_services && import_drug_data; then
                    echo -e "\n${GREEN}✓ Full setup completed successfully!${NC}"
                else
                    echo -e "\n${RED}✗ Setup failed${NC}"
                    exit 1
                fi
                ;;
            "services")
                echo -e "\n${GREEN}Starting services only (non-interactive)...${NC}"
                if start_services; then
                    echo -e "\n${GREEN}✓ Services started successfully!${NC}"
                    echo -e "${YELLOW}Note: Database is not initialized.${NC}"
                else
                    echo -e "\n${RED}✗ Failed to start services${NC}"
                    exit 1
                fi
                ;;
            "database")
                echo -e "\n${GREEN}Setting up database only (non-interactive)...${NC}"
                if ! dc ps | grep -q "Up"; then
                    echo -e "${RED}✗ Services are not running. Please start them first.${NC}"
                    exit 1
                fi
                if import_drug_data; then
                    echo -e "\n${GREEN}✓ Database setup completed successfully!${NC}"
                else
                    echo -e "\n${RED}✗ Database setup failed${NC}"
                    exit 1
                fi
                ;;
        esac
    else
        # Interactive mode - show menu and get user choice
        show_setup_menu
        choice=$?
        
        case $choice in
        1)
            echo -e "\n${GREEN}Running full setup...${NC}"
            if start_services && import_drug_data; then
                echo -e "\n${GREEN}✓ Full setup completed successfully!${NC}"
            else
                echo -e "\n${RED}✗ Setup failed${NC}"
                exit 1
            fi
            ;;
        2)
            echo -e "\n${GREEN}Starting services only...${NC}"
            if start_services; then
                echo -e "\n${GREEN}✓ Services started successfully!${NC}"
                echo -e "${YELLOW}Note: Database is not initialized. Run this script again to set up the database.${NC}"
            else
                echo -e "\n${RED}✗ Failed to start services${NC}"
                exit 1
            fi
            ;;
        3)
            echo -e "\n${GREEN}Setting up database only...${NC}"
            # Check if services are running
            if ! dc ps | grep -q "Up"; then
                echo -e "${RED}✗ Services are not running. Please start them first (option 2).${NC}"
                exit 1
            fi
            if import_drug_data; then
                echo -e "\n${GREEN}✓ Database setup completed successfully!${NC}"
            else
                echo -e "\n${RED}✗ Database setup failed${NC}"
                exit 1
            fi
            ;;
        4)
            echo -e "\n${GREEN}Custom setup selected...${NC}"
            if custom_setup; then
                echo -e "\n${GREEN}✓ Custom setup completed successfully!${NC}"
            else
                echo -e "\n${RED}✗ Custom setup failed${NC}"
                exit 1
            fi
            ;;
        5)
            echo -e "\n${BLUE}Setup cancelled.${NC}"
            exit 0
            ;;
        *)
            echo -e "\n${RED}Invalid choice. Please run the script again.${NC}"
            exit 1
            ;;
        esac
    fi
    
    # Success message (shown for successful operations)
    echo -e "\n${GREEN}=== Setup Complete! ===${NC}"
    echo -e "\nAccess the application:"
    echo -e "  ${BLUE}Frontend:${NC} http://localhost:3000"
    echo -e "  ${BLUE}API:${NC} http://localhost:3001"
    echo -e "\nUseful commands:"
    echo -e "  ${BLUE}View logs:${NC} $DOCKER_COMPOSE logs -f"
    echo -e "  ${BLUE}Stop all:${NC} $DOCKER_COMPOSE down"
    echo -e "  ${BLUE}Restart:${NC} $DOCKER_COMPOSE restart"
    echo -e "  ${BLUE}Reset all:${NC} $DOCKER_COMPOSE down -v"
    
    # Platform-specific notes
    case "$(uname -s)" in
        Darwin)
            echo -e "\n${YELLOW}macOS Note:${NC}"
            echo "If you experience slow performance, increase Docker Desktop's memory allocation"
            ;;
        Linux)
            echo -e "\n${YELLOW}Linux Note:${NC}"
            echo "If you get permission errors, ensure you're in the docker group"
            ;;
    esac
}

# Run main function
main