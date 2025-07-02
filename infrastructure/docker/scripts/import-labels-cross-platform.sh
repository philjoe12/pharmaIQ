#!/bin/bash
set -e

echo "=== PharmaIQ Labels Import Script (Cross-Platform) ==="

# Detect docker-compose command
if docker compose version >/dev/null 2>&1; then
    DC="docker compose"
    echo "Using Docker Compose v2"
elif command -v docker-compose >/dev/null 2>&1; then
    DC="docker-compose"
    echo "Using Docker Compose v1"
else
    echo "Error: Docker Compose is not installed"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Wait for database to be ready
echo "Waiting for database to be ready..."
until $DC exec -T postgres pg_isready -U pharmaiq -d pharmaiq_db >/dev/null 2>&1; do
    echo "Database is unavailable - sleeping"
    sleep 2
done
echo "Database is ready!"

# First, ensure the database tables exist
echo "Creating database tables..."
# Use the init-db.sql that's already mounted in the container
$DC exec -T postgres psql -U pharmaiq -d pharmaiq_db -f /docker-entrypoint-initdb.d/init.sql || {
    echo "Note: Some tables may already exist, continuing..."
}

# Create the missing drug_content table
echo "Creating drug_content table..."
$DC exec -T postgres psql -U pharmaiq -d pharmaiq_db << 'EOF'
CREATE TABLE IF NOT EXISTS drug_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    indications TEXT,
    contraindications TEXT,
    dosage TEXT,
    warnings TEXT,
    "sideEffects" TEXT,
    "enhancedContent" JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drug_id)
);

CREATE INDEX IF NOT EXISTS idx_drug_content_drug_id ON drug_content(drug_id);

-- Add trigger if function exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_drug_content_updated_at BEFORE UPDATE ON drug_content
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;
EOF

# Check if we need to install pg module
echo "Checking for required Node.js modules..."
if ! $DC exec -T api npm list pg >/dev/null 2>&1; then
    echo "Installing pg module..."
    $DC exec -T api npm install pg
else
    echo "pg module already installed"
fi

# Now run the import script
echo "Importing drugs from Labels.json..."
$DC exec -T api node /app/infrastructure/docker/scripts/import-labels.js

echo "Import complete! Checking results..."
$DC exec -T postgres psql -U pharmaiq -d pharmaiq_db -c "SELECT COUNT(*) as total_drugs FROM drugs;"
$DC exec -T postgres psql -U pharmaiq -d pharmaiq_db -c "SELECT drug_name, slug FROM drugs LIMIT 5;"

echo "
You can now access drug pages at:
"
$DC exec -T postgres psql -U pharmaiq -d pharmaiq_db -t -c "SELECT 'http://localhost:3000/drugs/' || slug FROM drugs LIMIT 5;"