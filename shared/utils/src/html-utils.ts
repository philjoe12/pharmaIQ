/**
 * HTML processing utilities
 */

/**
 * Extract sections from FDA label HTML
 */
export function extractHtmlSections(html: string): Map<string, string> {
  const sections = new Map<string, string>();
  const sectionRegex = /<section[^>]*data-sectioncode="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  
  let match;
  while ((match = sectionRegex.exec(html)) !== null) {
    const sectionCode = match[1];
    const sectionContent = match[2];
    sections.set(sectionCode, cleanHtmlContent(sectionContent));
  }
  
  return sections;
}

/**
 * Clean HTML content while preserving structure
 */
export function cleanHtmlContent(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .replace(/<a[^>]*name="[^"]*"[^>]*><\/a>/gi, '') // Remove empty anchors
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Convert HTML lists to array
 */
export function htmlListToArray(html: string): string[] {
  const items: string[] = [];
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

/**
 * Extract tables from HTML
 */
export function extractTables(html: string): Array<{ headers: string[], rows: string[][] }> {
  const tables: Array<{ headers: string[], rows: string[][] }> = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  
  let tableMatch;
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[1];
    const headers: string[] = [];
    const rows: string[][] = [];
    
    // Extract headers
    const headerRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
    let headerMatch;
    while ((headerMatch = headerRegex.exec(tableHtml)) !== null) {
      headers.push(headerMatch[1].replace(/<[^>]*>/g, '').trim());
    }
    
    // Extract rows
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[1];
      const cells: string[] = [];
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