"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateText = truncateText;
exports.toTitleCase = toTitleCase;
exports.cleanText = cleanText;
exports.stripHtml = stripHtml;
exports.countWords = countWords;
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength)
        return text;
    return text.slice(0, maxLength - 3) + '...';
}
function toTitleCase(text) {
    return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
}
function stripHtml(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
function countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
}
//# sourceMappingURL=text-utils.js.map