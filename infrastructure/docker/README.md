# PharmaIQ Docker Environment

Simple Docker setup for running PharmaIQ locally.

## Quick Start

```bash
# From the project root directory:
docker-compose up
```

That's it! The application will be available at:
- Frontend: `http://localhost:3000` (or `http://<your-server-ip>:3000`)
- API: `http://localhost:3001` (or `http://<your-server-ip>:3001`)

## Available Services

| Service | Port | Local Access | Remote Access |
|---------|------|-------------|---------------|
| **Web Frontend** | 3000 | `http://localhost:3000` | `http://<server-ip>:3000` |
| **API Gateway** | 3001 | `http://localhost:3001` | `http://<server-ip>:3001` |
| **PostgreSQL** | 5432 | `localhost:5432` | `<server-ip>:5432` |
| **Redis** | 6379 | `localhost:6379` | `<server-ip>:6379` |
| **Elasticsearch** | 9200 | `localhost:9200` | `<server-ip>:9200` |

## Common Docker Commands

### Basic Operations
```bash
# Start services
docker-compose up          # With logs
docker-compose up -d       # In background

# Stop services
docker-compose down        # Stop and remove containers
docker-compose stop        # Just stop containers

# View logs
docker-compose logs -f     # All services
docker-compose logs -f web # Specific service

# Restart a service
docker-compose restart web
```

## Troubleshooting Common Issues

### Permission Denied (Linux)
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo
sudo docker-compose up
```

### Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :3000  # or :3001

# Kill the process or change the port in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
docker-compose logs web  # or api, postgres, etc.

# Rebuild the container
docker-compose build --no-cache web
docker-compose up
```

### OpenAI API Key Issues
```bash
# Set the API key (optional for basic functionality)
export OPENAI_API_KEY="your-key-here"

# Or create .env file
echo "OPENAI_API_KEY=your-key-here" > .env

# Then restart
docker-compose down
docker-compose up
```

### Database Reset
```bash
# Stop and remove database
docker-compose down
docker volume rm pharmaiq_postgres-data

# Start fresh
docker-compose up
```

### Complete Reset
```bash
# Remove everything and start fresh
docker-compose down -v  # Removes all volumes
docker-compose up
```

## Advanced Usage

### Shell Access
```bash
# Access a container shell
docker-compose exec web sh
docker-compose exec api sh
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U pharmaiq -d pharmaiq_db
```

### Import Sample Data
```bash
# After services are running
docker-compose exec api node /app/infrastructure/docker/scripts/import-labels.js
```

## Tips

1. **First time setup** takes ~30-60 seconds for all services to be ready
2. **The frontend** accepts connections from any IP (0.0.0.0) for remote access
3. **Hot reloading** works automatically - just edit files and save
4. **OpenAI API key** is optional but enables AI features