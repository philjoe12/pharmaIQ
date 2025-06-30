"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
exports.generateDrugSlug = generateDrugSlug;
exports.generateUniqueSlug = generateUniqueSlug;
exports.extractDrugNameFromSlug = extractDrugNameFromSlug;
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);
}
function generateDrugSlug(brandName, activeIngredient) {
    const baseName = brandName || 'unknown-drug';
    const ingredient = activeIngredient || '';
    const slugParts = [baseName];
    if (ingredient && ingredient !== baseName) {
        slugParts.push(ingredient);
    }
    return generateSlug(slugParts.join(' '));
}
function generateUniqueSlug(baseSlug, suffix) {
    return `${baseSlug}-${suffix}`;
}
function extractDrugNameFromSlug(slug) {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
//# sourceMappingURL=slug-utils.js.map