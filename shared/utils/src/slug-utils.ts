/**
 * Slug generation utilities
 */

/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

/**
 * Generate drug slug with active ingredient
 */
export function generateDrugSlug(brandName: string, activeIngredient?: string): string {
  const baseName = brandName || 'unknown-drug';
  const ingredient = activeIngredient || '';
  
  const slugParts = [baseName];
  if (ingredient && ingredient !== baseName) {
    slugParts.push(ingredient);
  }
  
  return generateSlug(slugParts.join(' '));
}

/**
 * Generate unique slug with suffix
 */
export function generateUniqueSlug(baseSlug: string, suffix: string | number): string {
  return `${baseSlug}-${suffix}`;
}

/**
 * Extract drug name from slug
 */
export function extractDrugNameFromSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}