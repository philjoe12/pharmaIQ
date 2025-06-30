// Main types export - single source of truth
export * from './drug.types';
export * from './events.types';
export * from './fda-label.types';

// Legacy compatibility exports (deprecated)
// @deprecated Use types from drug.types instead
export type Drug = import('./drug.types').DrugEntity;
export type DrugLabel = import('./drug.types').FDALabel;