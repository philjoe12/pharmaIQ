import Head from 'next/head'

interface MetaTagsProps {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  noIndex?: boolean
}

export function MetaTags({ 
  title, 
  description, 
  keywords = [], 
  canonical, 
  ogImage, 
  noIndex = false 
}: MetaTagsProps) {
  const fullTitle = title.includes('PharmaIQ') ? title : `${title} | PharmaIQ`
  const keywordsString = keywords.join(', ')

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywordsString} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {ogImage && <meta property="og:image" content={ogImage} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
  )
}