# PharmaIQ Development Environment

This directory contains the Docker-based development environment for PharmaIQ with optimized volume management for Node.js development.

## Quick Start

```bash
# Start the development environment
./scripts/dev-start.sh

# For first time setup or after major changes
./scripts/dev-start.sh --init

# Clean everything and start fresh
./scripts/dev-start.sh --clean
```

## Volume Strategy

Our development setup uses a hybrid volume approach:

### 📁 Source Code (Bind Mounts)
- Live editing capability
- Changes immediately reflected in containers
- Supports hot reloading

### 📦 Dependencies (Named Volumes)
- `node_modules` directories stored in Docker volumes
- Prevents host/container conflicts
- Faster container startup
- Consistent across different host environments

### 🔨 Build Artifacts (Named Volumes)
- TypeScript compiled output (`dist/`)
- Next.js build cache (`.next/`)
- Preserved across container restarts

## Available Services

| Service | Port | Description |
|---------|------|-------------|
| **Web Frontend** | 3000 | Next.js application |
| **API Gateway** | 3001 | Main NestJS API + MCP Server |
| **Processing Worker** | - | Background job processor |
| **AI Worker** | - | AI/ML processing |
| **SEO Worker** | - | SEO content generation |
| **PostgreSQL** | 5432 | Primary database |
| **Redis** | 6379 | Cache and queues |

## Development Commands

### Environment Management
```bash
# Start development environment
./scripts/dev-start.sh

# Check service health
./scripts/dev-manage.sh health

# View logs (all services)
./scripts/dev-manage.sh logs

# View logs (specific service)
./scripts/dev-manage.sh logs api-gateway
```

### Service Management
```bash
# Rebuild a specific service
./scripts/dev-manage.sh rebuild api-gateway

# Get shell access
./scripts/dev-manage.sh shell api-gateway

# Install new dependency
./scripts/dev-manage.sh install web lodash
./scripts/dev-manage.sh install api-gateway @types/node
```

### Testing
```bash
# Run all tests
./scripts/dev-manage.sh test

# Run tests for specific service
./scripts/dev-manage.sh test api-gateway
```

### Maintenance
```bash
# Sync dependencies from host to containers
./scripts/dev-manage.sh sync

# Reset all volumes and start fresh
./scripts/dev-manage.sh reset
```

## MCP Server Development

The API Gateway includes an MCP (Model Context Protocol) server. To test MCP functionality:

1. **Check MCP Server Status**:
   ```bash
   curl http://localhost:3001/mcp/health
   ```

2. **View MCP Logs**:
   ```bash
   ./scripts/dev-manage.sh logs api-gateway | grep -i mcp
   ```

3. **Test MCP Tools**:
   Use the MCP Inspector or Claude Desktop to connect to `http://localhost:3001/mcp`

## Troubleshooting

### Container Won't Start
```bash
# Check container logs
./scripts/dev-manage.sh logs <service-name>

# Rebuild the service
./scripts/dev-manage.sh rebuild <service-name>
```

### Missing Dependencies
```bash
# Sync dependencies
./scripts/dev-manage.sh sync

# Or rebuild with fresh install
./scripts/dev-start.sh --init
```

### TypeScript Compilation Errors
```bash
# Check if shared packages are built
./scripts/dev-manage.sh shell api-gateway
# Inside container:
cd /app/shared/types && npm run build
cd /app/shared/contracts && npm run build
```

### Database Issues
```bash
# Reset database
docker-compose down postgres
docker volume rm docker_postgres_data
docker-compose up -d postgres
```

### Complete Reset
```bash
# Nuclear option - reset everything
./scripts/dev-start.sh --clean
```

## File Structure

```
infrastructure/docker/
├── docker-compose.yml          # Main service definitions
├── scripts/
│   ├── dev-start.sh           # Environment startup
│   ├── dev-manage.sh          # Management utilities
│   └── init-db.sh             # Database initialization
└── README.md                  # This file
```

## Volume Details

### Named Volumes
- `api-gateway-node-modules` - API Gateway dependencies
- `processing-worker-node-modules` - Processing Worker dependencies
- `ai-worker-node-modules` - AI Worker dependencies
- `seo-worker-node-modules` - SEO Worker dependencies
- `web-node-modules` - Web frontend dependencies
- `shared-types-node-modules` - Shared types package
- `shared-contracts-node-modules` - Shared contracts package
- `shared-utils-node-modules` - Shared utilities package
- `*-dist` - TypeScript build outputs
- `web-next` - Next.js build cache

### Benefits
- **Consistency**: Same dependencies across all environments
- **Performance**: Faster container startup and rebuilds
- **Isolation**: Host system doesn't affect container dependencies
- **Persistence**: Dependencies survive container recreation

## Tips

1. **First Time Setup**: Always use `./scripts/dev-start.sh --init`
2. **Adding Dependencies**: Use the management script to ensure proper installation
3. **IDE Integration**: You can still install dependencies locally for IDE support
4. **Hot Reloading**: All services support hot reloading for source changes
5. **Debugging**: Use `./scripts/dev-manage.sh shell <service>` to debug inside containers