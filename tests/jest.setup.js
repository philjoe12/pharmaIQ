// Jest setup file for integration tests

// Mock console methods to reduce test noise
global.console = {
  ...console,
  // Keep log and error for debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep error for debugging
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock external HTTP requests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    quit: jest.fn(),
  }));
});

// Mock Bull queue
jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
  }));
});

// Setup global test utilities
global.createMockDrugData = () => ({
  drugName: 'Test Drug',
  genericName: 'test-generic',
  manufacturer: 'Test Company',
  label: {
    indicationsAndUsage: 'Test indication',
    dosageAndAdministration: 'Test dosage',
    warningsAndPrecautions: 'Test warnings',
    contraindications: 'Test contraindications',
    adverseReactions: 'Test adverse reactions',
  },
});