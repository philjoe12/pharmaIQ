export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pharmaiq.com'
  const data = {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    name: "PharmaIQ Drug Database",
    description: "Structured data derived from FDA drug labels with AI enhancements.",
    url: baseUrl,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: ["FDA", "drug information", "pharmaceutical", "healthcare"],
    dataset: {
      "@type": "Dataset",
      name: "FDA Drug Labels",
      url: `${baseUrl}/drugs`,
      description: "Detailed labeling information for FDA approved drugs."
    }
  }

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
