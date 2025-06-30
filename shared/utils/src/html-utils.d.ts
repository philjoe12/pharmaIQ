export declare function extractHtmlSections(html: string): Map<string, string>;
export declare function cleanHtmlContent(html: string): string;
export declare function htmlListToArray(html: string): string[];
export declare function extractTables(html: string): Array<{
    headers: string[];
    rows: string[][];
}>;
