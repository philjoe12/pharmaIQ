# GitHub Actions Workflows

This directory contains automated tests to ensure PharmaIQ works across different platforms.

## Workflows

### docker-test.yml
Main cross-platform compatibility test that runs on:
- **Ubuntu** (latest and 20.04)
- **macOS** (latest and 13) - Intel-based
- **Windows** (with WSL2)

Tests include:
- Docker Compose configuration validation
- Basic service startup/shutdown
- Full stack test (Ubuntu only)
- Architecture compatibility checks

### cross-platform-test.yml
Extended test suite with additional platform-specific checks.

## Running Workflows

### Automatic Triggers
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual trigger via GitHub Actions UI

### Manual Trigger
1. Go to Actions tab in GitHub
2. Select the workflow
3. Click "Run workflow"

## Test Results

The workflows will show:
- ✅ Green check if Docker Compose works on that platform
- ❌ Red X if there are compatibility issues
- Detailed logs for debugging

## Adding Secrets

For full functionality, add these secrets in GitHub:
- `OPENAI_API_KEY` - Your OpenAI API key for AI features

Go to Settings → Secrets and variables → Actions → New repository secret

## Local Testing

To test what the GitHub Actions will do locally:
```bash
# Test configuration
docker-compose config

# Test basic startup
docker-compose up -d postgres redis
docker-compose ps
docker-compose down -v

# Run full test script
./test-cross-platform.sh
```