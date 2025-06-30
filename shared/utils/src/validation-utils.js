"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.isValidUrl = isValidUrl;
exports.isValidUuid = isValidUuid;
exports.isValidDrugName = isValidDrugName;
exports.isValidSlug = isValidSlug;
exports.sanitizeInput = sanitizeInput;
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function isValidUuid(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
function isValidDrugName(name) {
    const drugNameRegex = /^[a-zA-Z0-9\s\-()]+$/;
    return drugNameRegex.test(name) && name.length >= 2 && name.length <= 100;
}
function isValidSlug(slug) {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
}
function sanitizeInput(input) {
    return input
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .trim();
}
//# sourceMappingURL=validation-utils.js.map