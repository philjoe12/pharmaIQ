import Head from 'next/head';
export function BreadcrumbSchema({ items }) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url
        }))
    };
    return (<Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}/>
    </Head>);
}
export function BreadcrumbNavigation({ items }) {
    return (<nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (<li key={index} className="inline-flex items-center">
            {index > 0 && (<span className="mx-2 text-gray-400">/</span>)}
            {index === items.length - 1 ? (<span className="text-gray-500">{item.name}</span>) : (<a href={item.url} className="text-blue-600 hover:text-blue-800">
                {item.name}
              </a>)}
          </li>))}
      </ol>
    </nav>);
}
