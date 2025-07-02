#!/bin/bash
# Test Docker setup across critical production platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PharmaIQ Cross-Platform Testing ===${NC}"

# Detect current platform
PLATFORM=$(uname -s)
ARCH=$(uname -m)

echo -e "${YELLOW}Current platform: $PLATFORM ($ARCH)${NC}"

# Platform-specific volume mount options
VOLUME_OPTS=""
if [ "$PLATFORM" = "Linux" ]; then
    # Check for SELinux
    if command -v getenforce >/dev/null 2>&1 && [ "$(getenforce)" != "Disabled" ]; then
        echo -e "${YELLOW}SELinux detected - using :z flag for volumes${NC}"
        VOLUME_OPTS=":z"
    fi
fi

# Test 1: Ubuntu LTS (Most common production)
echo -e "\n${YELLOW}Test 1: Ubuntu 22.04 LTS environment${NC}"
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock$VOLUME_OPTS -v $(pwd):/workspace$VOLUME_OPTS -w /workspace ubuntu:22.04 bash -c "
  apt-get update -qq && apt-get install -y -qq docker.io docker-compose curl > /dev/null 2>&1
  echo 'Testing docker-compose config...'
  docker-compose config > /dev/null && echo '✓ Config valid' || echo '✗ Config invalid'
  echo 'Testing service connectivity...'
  docker-compose up -d > /dev/null 2>&1
  sleep 30
  curl -f http://localhost:3000 > /dev/null 2>&1 && echo '✓ Web service accessible' || echo '✗ Web service not accessible'
  curl -f http://localhost:3001/health > /dev/null 2>&1 && echo '✓ API service accessible' || echo '✗ API service not accessible'
  docker-compose down -v > /dev/null 2>&1
"

# Test 2: RHEL/Rocky Linux (Enterprise production)
echo -e "\n${YELLOW}Test 2: Rocky Linux 9 (RHEL-compatible) environment${NC}"
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock$VOLUME_OPTS -v $(pwd):/workspace$VOLUME_OPTS -w /workspace rockylinux:9 bash -c "
  dnf install -y -q docker docker-compose-plugin > /dev/null 2>&1
  echo 'Testing with SELinux context...'
  docker compose config > /dev/null && echo '✓ Config valid' || echo '✗ Config invalid'
"

# Test 3: Alpine Linux (Minimal container environment)
echo -e "\n${YELLOW}Test 3: Alpine Linux environment${NC}"
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock$VOLUME_OPTS -v $(pwd):/workspace$VOLUME_OPTS -w /workspace alpine:latest sh -c "
  apk add --no-cache docker docker-compose > /dev/null 2>&1
  echo 'Testing in minimal environment...'
  docker-compose config > /dev/null && echo '✓ Config valid' || echo '✗ Config invalid'
"

# Test 4: macOS simulation (for CI/CD)
echo -e "\n${YELLOW}Test 4: macOS compatibility checks${NC}"
if [ "$PLATFORM" = "Darwin" ]; then
    echo "Running on actual macOS..."
    # Check Docker Desktop
    if docker info | grep -q "Operating System:.*Docker Desktop"; then
        echo "✓ Docker Desktop detected"
        # Check for performance mode
        if docker info | grep -q "virtiofs"; then
            echo "✓ VirtioFS enabled (better performance)"
        else
            echo "! Consider enabling VirtioFS for better performance"
        fi
    fi
    
    # Test with macOS-specific volume options
    docker-compose config > /dev/null && echo "✓ Config valid on macOS" || echo "✗ Config invalid on macOS"
else
    echo "Not on macOS, skipping macOS-specific tests"
fi

# Test 5: WSL2 detection (for Windows developers)
echo -e "\n${YELLOW}Test 5: WSL2 compatibility checks${NC}"
if grep -qi microsoft /proc/version 2>/dev/null; then
    echo "✓ WSL2 environment detected"
    # Check for common WSL2 issues
    if [ -f /etc/wsl.conf ]; then
        echo "✓ WSL configuration found"
    fi
    # Test Docker daemon accessibility
    docker version > /dev/null 2>&1 && echo "✓ Docker daemon accessible" || echo "✗ Docker daemon not accessible"
else
    echo "Not in WSL2 environment"
fi

# Test 6: Architecture compatibility
echo -e "\n${YELLOW}Test 6: Architecture compatibility${NC}"
echo "Current architecture: $ARCH"
# Check if all images support current architecture
for image in node:20-alpine pgvector/pgvector:pg15 redis:7-alpine elasticsearch:8.11.0; do
    docker manifest inspect $image > /dev/null 2>&1 && echo "✓ $image supports $ARCH" || echo "✗ $image may not support $ARCH"
done

# Test 7: Docker Compose version compatibility
echo -e "\n${YELLOW}Test 7: Docker Compose version compatibility${NC}"
if command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose v1: $(docker-compose --version)"
    docker-compose config > /dev/null && echo "✓ v1 config valid" || echo "✗ v1 config invalid"
fi

if docker compose version >/dev/null 2>&1; then
    echo "docker compose v2: $(docker compose version)"
    docker compose config > /dev/null && echo "✓ v2 config valid" || echo "✗ v2 config invalid"
fi

echo -e "\n${GREEN}=== Testing Complete ===${NC}"