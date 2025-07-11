export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /knowledge-graph

Sitemap: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://pharmaiq.com'}/sitemap.xml`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}