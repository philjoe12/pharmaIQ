#!/bin/bash
# Cross-platform Docker Compose wrapper script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}PharmaIQ Docker Compose Launcher${NC}"
echo "Detecting Docker Compose installation..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run docker compose with fallback
run_docker_compose() {
    local compose_cmd=""
    local compose_version=""
    
    # Try docker compose (v2) first
    if command_exists docker && docker compose version >/dev/null 2>&1; then
        compose_cmd="docker compose"
        compose_version=$(docker compose version --short 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✓ Found Docker Compose v2: ${compose_version}${NC}"
    # Try docker-compose (v1)
    elif command_exists docker-compose; then
        compose_cmd="docker-compose"
        compose_version=$(docker-compose --version 2>/dev/null | awk '{print $3}' | sed 's/,$//' || echo "unknown")
        echo -e "${YELLOW}✓ Found Docker Compose v1: ${compose_version}${NC}"
        
        # Check for Python dependency issues
        if docker-compose version 2>&1 | grep -q "TypeError\|RequestsDependencyWarning"; then
            echo -e "${YELLOW}⚠ Detected Python dependency issues with docker-compose${NC}"
            
            # Try to use docker compose v2 if available
            if command_exists docker && docker compose version >/dev/null 2>&1; then
                echo -e "${GREEN}✓ Switching to Docker Compose v2${NC}"
                compose_cmd="docker compose"
            else
                echo -e "${RED}✗ Python dependency conflict detected. Attempting workaround...${NC}"
                
                # Set Python path to avoid conflicts
                export PYTHONPATH=""
                
                # Try with system Python
                if command_exists python3; then
                    compose_cmd="python3 -m compose"
                fi
            fi
        fi
    else
        echo -e "${RED}✗ Docker Compose not found!${NC}"
        echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}✗ Docker daemon is not running!${NC}"
        echo "Please start Docker and try again."
        exit 1
    fi
    
    # Check if .env file exists, create if not
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠ No .env file found. Creating with defaults...${NC}"
        cat > .env << 'EOF'
# Environment variables for Docker Compose
OPENAI_API_KEY=your_openai_api_key_here
EOF
        echo -e "${YELLOW}⚠ Please update the OPENAI_API_KEY in .env file${NC}"
    fi
    
    # Run docker compose
    echo -e "${GREEN}Starting PharmaIQ services...${NC}"
    echo "Command: $compose_cmd $@"
    echo "----------------------------------------"
    
    # Execute with error handling
    if $compose_cmd "$@"; then
        echo -e "${GREEN}✓ Docker Compose executed successfully${NC}"
    else
        exit_code=$?
        echo -e "${RED}✗ Docker Compose failed with exit code: $exit_code${NC}"
        
        # Provide troubleshooting tips
        echo -e "\n${YELLOW}Troubleshooting tips:${NC}"
        echo "1. Check Docker daemon: docker info"
        echo "2. Check Docker Compose version: docker-compose --version"
        echo "3. Try using Docker Compose v2: docker compose up"
        echo "4. Check for port conflicts: netstat -tulpn | grep -E '3000|3001|5432|6379|9200'"
        echo "5. Check disk space: df -h"
        
        exit $exit_code
    fi
}

# Main execution
run_docker_compose "$@"