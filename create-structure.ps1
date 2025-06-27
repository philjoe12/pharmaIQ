# PowerShell script to create PharmaIQ folder structure
# Save this as create-structure.ps1 and run it from C:\Users\phill\pharmaIQ

# Create services directories
$services = @(
    "services/api-gateway/src/modules/drugs/controllers",
    "services/api-gateway/src/modules/drugs/services",
    "services/api-gateway/src/modules/drugs/dto",
    "services/api-gateway/src/modules/search/controllers",
    "services/api-gateway/src/modules/search/services",
    "services/api-gateway/src/modules/events/publishers",
    "services/api-gateway/src/modules/events/listeners",
    "services/api-gateway/src/modules/mcp-server/tools",
    "services/api-gateway/src/modules/mcp-server/handlers",
    "services/api-gateway/src/modules/health",
    "services/api-gateway/src/common/filters",
    "services/api-gateway/src/common/interceptors",
    "services/api-gateway/src/common/middleware",
    "services/api-gateway/src/common/decorators",
    "services/api-gateway/src/config",
    "services/api-gateway/src/database/entities",
    "services/api-gateway/src/database/migrations",
    "services/api-gateway/src/database/repositories",
    "services/api-gateway/test/unit",
    "services/api-gateway/test/integration",
    "services/api-gateway/test/fixtures",
    "services/processing-worker/src/processors",
    "services/processing-worker/src/parsers/section-extractors",
    "services/processing-worker/src/queues",
    "services/ai-worker/src/processors",
    "services/ai-worker/src/providers",
    "services/ai-worker/src/prompts/templates",
    "services/ai-worker/src/validators",
    "services/ai-worker/src/retry",
    "services/seo-worker/src/processors",
    "services/seo-worker/src/generators",
    "services/seo-worker/src/services"
)

foreach ($dir in $services) {
    New-Item -ItemType Directory -Force -Path $dir
}

# Create web directories
$web = @(
    "web/src/app/robots.txt",
    "web/src/app/sitemap.xml",
    "web/src/app/drugs/[slug]",
    "web/src/app/drugs/compare",
    "web/src/app/drugs/discovery",
    "web/src/app/search",
    "web/src/app/api/revalidate",
    "web/src/app/api/health",
    "web/src/app/(admin)/admin/import",
    "web/src/components/drugs",
    "web/src/components/search",
    "web/src/components/comparison",
    "web/src/components/seo",
    "web/src/components/ui",
    "web/src/lib/api",
    "web/src/lib/seo",
    "web/src/lib/cache",
    "web/src/lib/utils",
    "web/src/styles/components",
    "web/public/images"
)

foreach ($dir in $web) {
    New-Item -ItemType Directory -Force -Path $dir
}

# Create shared directories
$shared = @(
    "shared/types/src",
    "shared/contracts/src/events",
    "shared/contracts/src/queues",
    "shared/utils/src/logger",
    "shared/utils/src/monitoring",
    "shared/utils/src/validators"
)

foreach ($dir in $shared) {
    New-Item -ItemType Directory -Force -Path $dir
}

# Create other directories
$others = @(
    "data/input",
    "data/processed",
    "data/cache",
    "infrastructure/docker/scripts",
    "infrastructure/nginx",
    "infrastructure/monitoring/prometheus",
    "infrastructure/monitoring/grafana/dashboards",
    "tests/e2e/specs",
    "tests/e2e/fixtures",
    "tests/integration",
    "tests/performance/k6",
    "tests/performance/lighthouse",
    "tests/contracts",
    "scripts/development",
    "scripts/deployment",
    "scripts/maintenance",
    "docs/architecture/diagrams",
    "docs/api",
    "docs/deployment",
    ".github/workflows"
)

foreach ($dir in $others) {
    New-Item -ItemType Directory -Force -Path $dir
}

# Create all TypeScript files
$tsFiles = @(
    # API Gateway files
    "services/api-gateway/src/modules/drugs/controllers/drug.controller.ts",
    "services/api-gateway/src/modules/drugs/controllers/drug-admin.controller.ts",
    "services/api-gateway/src/modules/drugs/services/drug.service.ts",
    "services/api-gateway/src/modules/drugs/services/drug-cache.service.ts",
    "services/api-gateway/src/modules/drugs/dto/drug.dto.ts",
    "services/api-gateway/src/modules/drugs/dto/drug-query.dto.ts",
    "services/api-gateway/src/modules/drugs/drug.module.ts",
    "services/api-gateway/src/modules/search/controllers/search.controller.ts",
    "services/api-gateway/src/modules/search/services/elasticsearch.service.ts",
    "services/api-gateway/src/modules/search/services/search-aggregator.service.ts",
    "services/api-gateway/src/modules/search/search.module.ts",
    "services/api-gateway/src/modules/events/publishers/base-publisher.ts",
    "services/api-gateway/src/modules/events/publishers/drug-events.publisher.ts",
    "services/api-gateway/src/modules/events/publishers/seo-events.publisher.ts",
    "services/api-gateway/src/modules/events/listeners/cache-invalidation.listener.ts",
    "services/api-gateway/src/modules/events/listeners/search-index.listener.ts",
    "services/api-gateway/src/modules/events/events.module.ts",
    "services/api-gateway/src/modules/mcp-server/tools/drug-lookup.tool.ts",
    "services/api-gateway/src/modules/mcp-server/tools/similarity-search.tool.ts",
    "services/api-gateway/src/modules/mcp-server/tools/condition-drugs.tool.ts",
    "services/api-gateway/src/modules/mcp-server/tools/dosage-calculator.tool.ts",
    "services/api-gateway/src/modules/mcp-server/handlers/mcp-request.handler.ts",
    "services/api-gateway/src/modules/mcp-server/mcp.server.ts",
    "services/api-gateway/src/modules/mcp-server/mcp.module.ts",
    "services/api-gateway/src/modules/health/health.controller.ts",
    "services/api-gateway/src/modules/health/health.module.ts",
    "services/api-gateway/src/common/filters/http-exception.filter.ts",
    "services/api-gateway/src/common/filters/validation-exception.filter.ts",
    "services/api-gateway/src/common/interceptors/logging.interceptor.ts",
    "services/api-gateway/src/common/interceptors/cache.interceptor.ts",
    "services/api-gateway/src/common/interceptors/performance.interceptor.ts",
    "services/api-gateway/src/common/middleware/rate-limit.middleware.ts",
    "services/api-gateway/src/common/middleware/request-id.middleware.ts",
    "services/api-gateway/src/common/decorators/cache-key.decorator.ts",
    "services/api-gateway/src/common/decorators/api-version.decorator.ts",
    "services/api-gateway/src/config/app.config.ts",
    "services/api-gateway/src/config/database.config.ts",
    "services/api-gateway/src/config/redis.config.ts",
    "services/api-gateway/src/config/event-bus.config.ts",
    "services/api-gateway/src/database/entities/drug.entity.ts",
    "services/api-gateway/src/database/entities/drug-content.entity.ts",
    "services/api-gateway/src/database/entities/seo-metadata.entity.ts",
    "services/api-gateway/src/database/entities/processing-log.entity.ts",
    "services/api-gateway/src/database/migrations/1.0.0-initial-schema.ts",
    "services/api-gateway/src/database/repositories/drug.repository.ts",
    "services/api-gateway/src/database/repositories/base.repository.ts",
    "services/api-gateway/src/main.ts",
    
    # Processing Worker files
    "services/processing-worker/src/processors/label-import.processor.ts",
    "services/processing-worker/src/processors/html-parser.processor.ts",
    "services/processing-worker/src/processors/data-validator.processor.ts",
    "services/processing-worker/src/parsers/fda-label.parser.ts",
    "services/processing-worker/src/parsers/section-extractors/indication.extractor.ts",
    "services/processing-worker/src/parsers/section-extractors/dosage.extractor.ts",
    "services/processing-worker/src/parsers/section-extractors/warnings.extractor.ts",
    "services/processing-worker/src/parsers/section-extractors/adverse-reactions.extractor.ts",
    "services/processing-worker/src/parsers/table-parser.ts",
    "services/processing-worker/src/queues/processing.queue.ts",
    "services/processing-worker/src/queues/queue-config.ts",
    "services/processing-worker/src/app.module.ts",
    "services/processing-worker/src/main.ts",
    
    # AI Worker files
    "services/ai-worker/src/processors/content-enhancement.processor.ts",
    "services/ai-worker/src/processors/seo-generation.processor.ts",
    "services/ai-worker/src/processors/faq-creation.processor.ts",
    "services/ai-worker/src/providers/openai.provider.ts",
    "services/ai-worker/src/providers/anthropic.provider.ts",
    "services/ai-worker/src/providers/ai-provider.interface.ts",
    "services/ai-worker/src/prompts/templates/seo-title.prompt.ts",
    "services/ai-worker/src/prompts/templates/meta-description.prompt.ts",
    "services/ai-worker/src/prompts/templates/content-simplification.prompt.ts",
    "services/ai-worker/src/prompts/templates/faq-generation.prompt.ts",
    "services/ai-worker/src/prompts/templates/related-drugs.prompt.ts",
    "services/ai-worker/src/prompts/prompt-builder.service.ts",
    "services/ai-worker/src/validators/medical-accuracy.validator.ts",
    "services/ai-worker/src/validators/content-quality.validator.ts",
    "services/ai-worker/src/retry/retry-strategy.ts",
    "services/ai-worker/src/main.ts",
    
    # SEO Worker files
    "services/seo-worker/src/processors/structured-data.processor.ts",
    "services/seo-worker/src/processors/sitemap.processor.ts",
    "services/seo-worker/src/processors/knowledge-graph.processor.ts",
    "services/seo-worker/src/generators/schema-markup.generator.ts",
    "services/seo-worker/src/generators/meta-tags.generator.ts",
    "services/seo-worker/src/generators/internal-links.generator.ts",
    "services/seo-worker/src/services/search-index.service.ts",
    "services/seo-worker/src/services/cdn-cache.service.ts",
    "services/seo-worker/src/main.ts",
    
    # Shared files
    "shared/types/src/drug.types.ts",
    "shared/types/src/fda-label.types.ts",
    "shared/types/src/events.types.ts",
    "shared/types/src/api-responses.types.ts",
    "shared/contracts/src/events/drug-import.event.ts",
    "shared/contracts/src/events/content-enhanced.event.ts",
    "shared/contracts/src/events/seo-generated.event.ts",
    "shared/contracts/src/queues/job-definitions.ts",
    "shared/utils/src/logger/winston.logger.ts",
    "shared/utils/src/monitoring/metrics.ts",
    "shared/utils/src/monitoring/tracing.ts",
    "shared/utils/src/validators/drug.validators.ts",
    
    # Test files
    "tests/e2e/specs/drug-import.e2e.spec.ts",
    "tests/e2e/specs/drug-pages.e2e.spec.ts",
    "tests/e2e/specs/search.e2e.spec.ts",
    "tests/integration/event-flow.test.ts",
    "tests/integration/ai-pipeline.test.ts",
    "tests/integration/seo-generation.test.ts",
    "tests/contracts/event-contracts.test.ts",
    "tests/contracts/api-contracts.test.ts",
    
    # Scripts
    "scripts/maintenance/reindex-search.ts",
    "scripts/maintenance/regenerate-seo.ts",
    "scripts/maintenance/cleanup-cache.ts",
    
    # Config files
    "shared/types/tsconfig.json",
    "services/api-gateway/tsconfig.json",
    "web/tailwind.config.ts",
    "tests/e2e/playwright.config.ts"
)

foreach ($file in $tsFiles) {
    New-Item -ItemType File -Force -Path $file
}

# Create TSX files
$tsxFiles = @(
    "web/src/app/layout.tsx",
    "web/src/app/page.tsx",
    "web/src/app/drugs/layout.tsx",
    "web/src/app/drugs/[slug]/page.tsx",
    "web/src/app/drugs/[slug]/loading.tsx",
    "web/src/app/drugs/[slug]/error.tsx",
    "web/src/app/drugs/[slug]/opengraph-image.tsx",
    "web/src/app/drugs/compare/page.tsx",
    "web/src/app/drugs/discovery/page.tsx",
    "web/src/app/search/page.tsx",
    "web/src/app/(admin)/admin/layout.tsx",
    "web/src/app/(admin)/admin/import/page.tsx",
    "web/src/components/drugs/DrugHeader.tsx",
    "web/src/components/drugs/IndicationsSection.tsx",
    "web/src/components/drugs/DosageTable.tsx",
    "web/src/components/drugs/WarningsAccordion.tsx",
    "web/src/components/drugs/AdverseReactions.tsx",
    "web/src/components/drugs/FAQSection.tsx",
    "web/src/components/drugs/RelatedDrugs.tsx",
    "web/src/components/search/SearchBar.tsx",
    "web/src/components/search/SearchResults.tsx",
    "web/src/components/search/SearchFilters.tsx",
    "web/src/components/comparison/ComparisonTable.tsx",
    "web/src/components/comparison/DrugSelector.tsx",
    "web/src/components/seo/StructuredData.tsx",
    "web/src/components/seo/BreadcrumbSchema.tsx",
    "web/src/components/seo/MetaTags.tsx",
    "web/src/components/ui/Card.tsx",
    "web/src/components/ui/Button.tsx",
    "web/src/components/ui/LoadingSpinner.tsx"
)

foreach ($file in $tsxFiles) {
    New-Item -ItemType File -Force -Path $file
}

# Create route.ts files
$routeFiles = @(
    "web/src/app/robots.txt/route.ts",
    "web/src/app/sitemap.xml/route.ts",
    "web/src/app/api/revalidate/route.ts",
    "web/src/app/api/health/route.ts"
)

foreach ($file in $routeFiles) {
    New-Item -ItemType File -Force -Path $file
}

# Create lib files
$libFiles = @(
    "web/src/lib/api/client.ts",
    "web/src/lib/api/drugs.api.ts",
    "web/src/lib/api/search.api.ts",
    "web/src/lib/seo/metadata.ts",
    "web/src/lib/seo/structured-data.ts",
    "web/src/lib/seo/sitemap.ts",
    "web/src/lib/cache/cache-tags.ts",
    "web/src/lib/utils/format.ts",
    "web/src/lib/utils/validation.ts"
)

foreach ($file in $libFiles) {
    New-Item -ItemType File -Force -Path $file
}

# Create JavaScript files
$jsFiles = @(
    "web/next.config.js",
    "tests/performance/k6/drug-pages-load.js",
    "tests/performance/k6/api-stress.js",
    "tests/performance/lighthouse/seo-audit.js"
)

foreach ($file in $jsFiles) {
    New-Item -ItemType File -Force -Path $file
}

# Create JSON files
$jsonFiles = @(
    "services/api-gateway/package.json",
    "services/processing-worker/package.json",
    "services/ai-worker/package.json",
    "services/seo-worker/package.json",
    "web/package.json",
    "shared/types/package.json",
    "shared/contracts/package.json",
    "shared/utils/package.json",
    "data/input/labels.json",
    "tests/e2e/fixtures/test-label.json",
    "infrastructure/monitoring/grafana/dashboards/api-metrics.json",
    "infrastructure/monitoring/grafana/dashboards/seo-performance.json",
    "infrastructure/monitoring/grafana/dashboards/ai-usage.json",
    "turbo.json",
    "package.json"
)

foreach ($file in $jsonFiles) {
    New-Item -ItemType File -Force -Path $file
}

# Create Docker files
$dockerFiles = @(
    "services/api-gateway/Dockerfile",
    "services/processing-worker/Dockerfile",
    "services/ai-worker/Dockerfile",
    "services/seo-worker/Dockerfile",
    "web/Dockerfile"
)

foreach ($file in $dockerFiles) {
    New-Item -ItemType File -Force -Path $file
}

# Create YAML files
$yamlFiles = @(
    "infrastructure/docker/docker-compose.yml",
    "infrastructure/docker/docker-compose.dev.yml",
    "infrastructure/monitoring/prometheus/prometheus.yml",
    ".github/workflows/ci.yml",
    ".github/workflows/seo-audit.yml",
    ".github/workflows/deploy.yml"
)

foreach ($file in $yamlFiles) {
    New-Item -ItemType File -Force -Path $file
}

# Create shell scripts
$shellFiles = @(
    "infrastructure/docker/scripts/init-db.sh",
    "infrastructure/docker/scripts/seed-data.sh",
    "scripts/development/start-dev.sh",
    "scripts/development/reset-db.sh",
    "scripts/development/generate-types.sh",
    "scripts/deployment/health-check.sh",
    "scripts/deployment/rollback.sh"
)

foreach ($file in $shellFiles) {
    New-Item -ItemType File -Force -Path $file
}

# Create configuration files
$configFiles = @(
    "infrastructure/nginx/nginx.conf",
    "infrastructure/nginx/cache.conf",
    "web/src/styles/globals.css",
    "web/public/favicon.ico",
    "infrastructure/docker/.env.example",
    ".env.example",
    ".gitignore"
)

foreach ($file in $configFiles) {
    New-Item -ItemType File -Force -Path $file
}

# Create documentation files
$docFiles = @(
    "docs/architecture/README.md",
    "docs/architecture/event-flow.md",
    "docs/architecture/seo-strategy.md",
    "docs/architecture/diagrams/system-architecture.mermaid",
    "docs/architecture/diagrams/event-flow.mermaid",
    "docs/api/rest-api.md",
    "docs/api/mcp-tools.md",
    "docs/deployment/setup-guide.md",
    "docs/deployment/troubleshooting.md",
    ".github/PULL_REQUEST_TEMPLATE.md",
    "README.md"
)

foreach ($file in $docFiles) {
    New-Item -ItemType File -Force -Path $file
}

Write-Host "PharmaIQ folder structure created successfully!" -ForegroundColor Green
Write-Host "Total directories created: $($services.Count + $web.Count + $shared.Count + $others.Count)" -ForegroundColor Cyan
Write-Host "Total files created: $($tsFiles.Count + $tsxFiles.Count + $routeFiles.Count + $libFiles.Count + $jsFiles.Count + $jsonFiles.Count + $dockerFiles.Count + $yamlFiles.Count + $shellFiles.Count + $configFiles.Count + $docFiles.Count)" -ForegroundColor Cyan