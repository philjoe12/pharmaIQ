#!/bin/bash
set -e

echo "=== PharmaIQ Database Reset Script ==="
echo "⚠️  WARNING: This will delete all data in the database!"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-pharmaiq}"
DB_USER="${DATABASE_USERNAME:-pharmaiq_user}"
DB_PASSWORD="${DATABASE_PASSWORD:-pharmaiq_dev_password}"

# Prompt for confirmation
read -p "Are you sure you want to reset the database? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Database reset cancelled.${NC}"
    exit 0
fi

echo -e "${YELLOW}Resetting database...${NC}"

# Drop and recreate database
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres << EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
EOF

echo -e "${GREEN}Database dropped and recreated.${NC}"

# Run initialization script
echo -e "${YELLOW}Running initialization script...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < /pharmaIQ/infrastructure/docker/scripts/init-db.sql

echo -e "${GREEN}✅ Database reset completed successfully!${NC}"
echo -e "${YELLOW}You can now run the seed script: ./infrastructure/docker/scripts/seed-data.sh${NC}"