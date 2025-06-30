import { Drug } from '../api/drugs.api'

export interface StructuredDataBase {
  '@context': string
  '@type': string
}

export interface DrugStructuredData extends StructuredDataBase {
  '@type': 'Drug'
  name: string
  alternateName?: string
  manufacturer: {
    '@type': 'Organization'
    name: string
  }
  description: string
  activeIngredient?: string
  drugClass?: string
  url: string
}

export interface OrganizationStructuredData extends StructuredDataBase {
  '@type': 'Organization'
  name: string
  description: string
  url: string
  logo?: string
}

export interface BreadcrumbStructuredData extends StructuredDataBase {
  '@type': 'BreadcrumbList'
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }>
}

export class StructuredDataGenerator {
  static generateDrugStructuredData(drug: Drug, baseUrl: string): DrugStructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Drug',
      name: drug.name,
      alternateName: drug.genericName,
      manufacturer: {
        '@type': 'Organization',
        name: drug.manufacturer
      },
      description: drug.description,
      url: `${baseUrl}/drugs/${drug.slug}`
    }
  }

  static generateOrganizationStructuredData(): OrganizationStructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'PharmaIQ',
      description: 'Your trusted source for comprehensive drug information powered by AI',
      url: process.env.NEXT_PUBLIC_BASE_URL || 'https://pharmaiq.com'
    }
  }

  static generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>): BreadcrumbStructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    }
  }

  static jsonLd(data: any): string {
    return JSON.stringify(data, null, 2)
  }
}

export const structuredDataGenerator = StructuredDataGenerator