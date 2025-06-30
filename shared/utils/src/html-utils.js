"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractHtmlSections = extractHtmlSections;
exports.cleanHtmlContent = cleanHtmlContent;
exports.htmlListToArray = htmlListToArray;
exports.extractTables = extractTables;
function extractHtmlSections(html) {
    const sections = new Map();
    const sectionRegex = /<section[^>]*data-sectioncode="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
    let match;
    while ((match = sectionRegex.exec(html)) !== null) {
        const sectionCode = match[1];
        const sectionContent = match[2];
        sections.set(sectionCode, cleanHtmlContent(sectionContent));
    }
    return sections;
}
function cleanHtmlContent(html) {
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<a[^>]*name="[^"]*"[^>]*><\/a>/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function htmlListToArray(html) {
    const items = [];
    const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match;
    while ((match = listItemRegex.exec(html)) !== null) {
        const text = match[1].replace(/<[^>]*>/g, '').trim();
        if (text) {
            items.push(text);
        }
    }
    return items;
}
function extractTables(html) {
    const tables = [];
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;
    while ((tableMatch = tableRegex.exec(html)) !== null) {
        const tableHtml = tableMatch[1];
        const headers = [];
        const rows = [];
        const headerRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
        let headerMatch;
        while ((headerMatch = headerRegex.exec(tableHtml)) !== null) {
            headers.push(headerMatch[1].replace(/<[^>]*>/g, '').trim());
        }
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;
        while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
            const rowHtml = rowMatch[1];
            const cells = [];
            const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
            let cellMatch;
            while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
                cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
            }
            if (cells.length > 0) {
                rows.push(cells);
            }
        }
        if (headers.length > 0 || rows.length > 0) {
            tables.push({ headers, rows });
        }
    }
    return tables;
}
//# sourceMappingURL=html-utils.js.map