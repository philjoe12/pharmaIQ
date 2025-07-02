#!/usr/bin/env node
/**
 * Credential validation script for PharmaIQ
 * Ensures database credentials match across all configuration files
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Expected credentials (from docker-compose.yml)
const EXPECTED_CREDENTIALS = {
  database: {
    user: 'pharmaiq',
    password: 'pharmaiq_dev',
    name: 'pharmaiq_db',
    host: 'postgres', // internal Docker network name
    port: 5432
  }
};

// Files to check
const FILES_TO_CHECK = [
  {
    path: 'docker-compose.yml',
    type: 'yaml',
    checks: [
      { path: ['services', 'postgres', 'environment', 'POSTGRES_USER'], expected: EXPECTED_CREDENTIALS.database.user },
      { path: ['services', 'postgres', 'environment', 'POSTGRES_PASSWORD'], expected: EXPECTED_CREDENTIALS.database.password },
      { path: ['services', 'postgres', 'environment', 'POSTGRES_DB'], expected: EXPECTED_CREDENTIALS.database.name }
    ]
  },
  {
    path: '.env.example',
    type: 'env',
    checks: [
      { key: 'DATABASE_USER', expected: EXPECTED_CREDENTIALS.database.user },
      { key: 'DATABASE_PASSWORD', expected: EXPECTED_CREDENTIALS.database.password },
      { key: 'DATABASE_NAME', expected: EXPECTED_CREDENTIALS.database.name }
    ]
  },
  {
    path: 'infrastructure/docker/scripts/import-labels.js',
    type: 'js',
    checks: [
      { pattern: /user:\s*'(\w+)'/, expected: EXPECTED_CREDENTIALS.database.user },
      { pattern: /password:\s*'(\w+)'/, expected: EXPECTED_CREDENTIALS.database.password },
      { pattern: /database:\s*'(\w+)'/, expected: EXPECTED_CREDENTIALS.database.name }
    ]
  }
];

// Parse YAML file
function parseYaml(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContent);
  } catch (error) {
    console.error(`Error reading YAML file ${filePath}:`, error.message);
    return null;
  }
}

// Parse .env file
function parseEnv(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const env = {};
    fileContent.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim();
      }
    });
    return env;
  } catch (error) {
    console.error(`Error reading env file ${filePath}:`, error.message);
    return null;
  }
}

// Get nested value from object
function getNestedValue(obj, path) {
  return path.reduce((current, key) => current?.[key], obj);
}

// Validate credentials
function validateCredentials() {
  console.log('🔍 PharmaIQ Credential Validation\n');
  console.log('Expected credentials:');
  console.log(`  Database User: ${EXPECTED_CREDENTIALS.database.user}`);
  console.log(`  Database Name: ${EXPECTED_CREDENTIALS.database.name}`);
  console.log(`  Database Password: [REDACTED]\n`);

  let hasErrors = false;

  FILES_TO_CHECK.forEach(file => {
    console.log(`\nChecking ${file.path}...`);
    
    const fullPath = path.join(__dirname, '..', file.path);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`  ⚠️  File not found: ${file.path}`);
      return;
    }

    let data;
    let fileContent;
    
    switch (file.type) {
      case 'yaml':
        data = parseYaml(fullPath);
        break;
      case 'env':
        data = parseEnv(fullPath);
        break;
      case 'js':
        fileContent = fs.readFileSync(fullPath, 'utf8');
        break;
    }

    file.checks.forEach(check => {
      let actual;
      
      if (file.type === 'yaml' && data) {
        actual = getNestedValue(data, check.path);
      } else if (file.type === 'env' && data) {
        actual = data[check.key];
      } else if (file.type === 'js' && fileContent) {
        const match = fileContent.match(check.pattern);
        actual = match ? match[1] : null;
      }

      if (actual === check.expected) {
        console.log(`  ✅ ${check.path?.join('.') || check.key || check.pattern}: ${actual}`);
      } else {
        console.log(`  ❌ ${check.path?.join('.') || check.key || check.pattern}: Expected "${check.expected}", found "${actual}"`);
        hasErrors = true;
      }
    });
  });

  // Check for .env file
  console.log('\n\nEnvironment file check:');
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    console.log('  ✅ .env file exists');
    
    // Check for OpenAI API key
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('OPENAI_API_KEY=') && !envContent.includes('OPENAI_API_KEY=your-openai-api-key-here')) {
      console.log('  ✅ OPENAI_API_KEY appears to be set');
    } else {
      console.log('  ⚠️  OPENAI_API_KEY not set or using placeholder value');
    }
  } else {
    console.log('  ⚠️  .env file not found - copy .env.example to .env and configure');
  }

  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ Credential validation failed!');
    console.log('Please ensure all configuration files use the same credentials.');
    process.exit(1);
  } else {
    console.log('✅ All credentials match!');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env if not done already');
    console.log('2. Set your OPENAI_API_KEY in the .env file');
    console.log('3. Run: docker compose up');
  }
}

// Check if js-yaml is installed
try {
  require('js-yaml');
} catch (error) {
  console.log('Installing required dependency: js-yaml');
  const { execSync } = require('child_process');
  execSync('npm install js-yaml', { stdio: 'inherit' });
}

// Run validation
validateCredentials();