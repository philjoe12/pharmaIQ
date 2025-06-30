import Head from 'next/head'

interface DrugStructuredDataProps {
  name: string
  genericName?: string
  manufacturer: string
  description: string
  activeIngredient?: string
  drugClass?: string
  url: string
}

export function DrugStructuredData({
  name,
  genericName,
  manufacturer,
  description,
  activeIngredient,
  drugClass,
  url
}: DrugStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Drug',
    name: name,
    alternateName: genericName,
    manufacturer: {
      '@type': 'Organization',
      name: manufacturer
    },
    description: description,
    activeIngredient: activeIngredient,
    drugClass: drugClass,
    url: url,
    sameAs: url
  }

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  )
}

interface OrganizationStructuredDataProps {
  name: string
  description: string
  url: string
  logo?: string
}

export function OrganizationStructuredData({
  name,
  description,
  url,
  logo
}: OrganizationStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: name,
    description: description,
    url: url,
    ...(logo && { logo: logo })
  }

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  )
}