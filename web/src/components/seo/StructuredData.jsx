import Head from 'next/head';
export function DrugStructuredData({ name, genericName, manufacturer, description, activeIngredient, drugClass, url }) {
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
    };
    return (<Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}/>
    </Head>);
}
export function OrganizationStructuredData({ name, description, url, logo }) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: name,
        description: description,
        url: url,
        ...(logo && { logo: logo })
    };
    return (<Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}/>
    </Head>);
}
