import {
  comfyrobeData,
  utekosData
} from './sizeGuideData'
import {
  TECH_DOWN_PUBLIC_SIZE_DEFINITIONS,
  TECH_DOWN_MEASUREMENT_COLUMNS,
  TECH_DOWN_SIZE_ROWS
} from './techDownSizes'
import { utekosSizeCards } from './utekosSizeCards'
import { resolveProductSizeGuideFamily, type ProductSizeGuideFamily } from './resolveProductSizeGuideFamily'
import { productTitle } from '@/lib/catalog/productTitle'

export type ProductSizeGuideSizeTip = {
  size: string
  heading: string
  heightGuide: string
  fitGuidance: readonly string[]
}

export type ProductSizeGuideMeasurementRow = {
  measurement: string
  values: readonly string[]
}

export type ProductSizeGuideContent = {
  badge: string
  title: string
  description: string
  tableCaption: string
  tableAriaLabel: string
  rowHeader: string
  columns: readonly string[]
  rows: readonly ProductSizeGuideMeasurementRow[]
  sizeTips: readonly ProductSizeGuideSizeTip[]
  sizeTipLabel?: string
}

const comfyrobeSizeTips = [
  {
    size: 'XS',
    heading: 'Velg XS hvis...',
    heightGuide: 'Small',
    fitGuidance: [
      'Du bruker vanligvis small og vil beholde den korteste passformen.',
      'Du ønsker romslig komfort, men uten ekstra lengde og bredde.'
    ]
  },
  {
    size: 'M/L',
    heading: 'Velg M/L hvis...',
    heightGuide: 'Medium',
    fitGuidance: [
      'Du bruker vanligvis medium og ønsker den mest balanserte passformen.',
      'Du vil bruke Comfyrobe uten behov for et ekstra lag med klær under.'
    ]
  },
  {
    size: 'XL',
    heading: 'Velg XL hvis...',
    heightGuide: 'Large',
    fitGuidance: [
      'Du bruker vanligvis large, eller bevisst ønsker en mer overdimensjonert følelse.',
      'Du prioriterer maksimal dekning rundt kropp, skuldre og hette.'
    ]
  }
] as const satisfies readonly ProductSizeGuideSizeTip[]

function mapRows(
  data: readonly Record<string, string>[],
  columnKeys: readonly string[]
): readonly ProductSizeGuideMeasurementRow[] {
  return data.map(row => ({
    measurement: row.measurement ?? '',
    values: columnKeys.map(key => row[key] ?? '—')
  }))
}

export function getProductSizeGuideContent(
  family: ProductSizeGuideFamily
): ProductSizeGuideContent {
  if (family === 'stapper') {
    return {
      badge: 'Utekos Stapper™',
      title: 'Størrelsesguide',
      description: 'Utekos Stapper™ leveres i én størrelse (OneSize).',
      tableCaption: '',
      tableAriaLabel: '',
      rowHeader: '',
      columns: [],
      rows: [],
      sizeTips: []
    }
  }
  if (family === 'comfyrobe') {
    return {
      badge: 'Comfyrobe™',
      title: 'Størrelsesguide',
      description:
        'Sammenlign målene med et lignende plagg du allerede har. Alle mål er oppgitt i centimeter.',
      tableCaption: 'Mål for Comfyrobe-størrelser',
      tableAriaLabel: 'Måletabell for Comfyrobe-størrelser',
      rowHeader: 'Måling',
      columns: ['XS', 'M/L', 'XL'],
      rows: mapRows(comfyrobeData, ['xs', 'ml', 'lxl']),
      sizeTips: comfyrobeSizeTips,
      sizeTipLabel: 'Tilsvarer'
    }
  }

  if (family === 'techdown') {
    return {
      badge: 'TechDown™',
      title: 'Størrelsesguide: Utekos TechDown™',
      description:
        'Finn nøyaktig TechDown™-størrelse med høydeguider, måletips og måletabell.',
      tableCaption: 'Mål for TechDown-størrelser',
      tableAriaLabel: 'Måletabell for TechDown-størrelser',
      rowHeader: 'Størrelse',
      columns: TECH_DOWN_MEASUREMENT_COLUMNS.map(
        column => column.label
      ),
      rows: TECH_DOWN_SIZE_ROWS.map(row => ({
        measurement: row.size,
        values: row.values
      })),
      sizeTips: TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.map(card => ({
        size: card.size,
        heading: `Velg ${card.size} hvis...`,
        heightGuide: card.heightGuide,
        fitGuidance: card.fitGuidance
      }))
    }
  }

  return {
    badge: 'Mikrofiber & Dun',
    title: 'Størrelsesguide',
    description:
      'Utekos Dun og Mikrofiber er designet for suveren tilpasningsevne. Velg medium for tettere passform, eller large for maksimal romslighet.',
    tableCaption: 'Mål for Utekos Dun og Mikrofiber',
    tableAriaLabel:
      'Måletabell for Utekos Dun og Mikrofiber størrelser',
    rowHeader: 'Måling',
    columns: ['Medium', 'Large'],
    rows: mapRows(utekosData, ['m', 'l']),
    sizeTips: utekosSizeCards.map(card => ({
      size: card.sizeCode,
      heading: card.heading,
      heightGuide: card.heightGuide,
      fitGuidance: card.fitGuidance
    }))
  }
}

/** Product-specific content for the shared OS Caravan dialog presentation. */
export function getProductSizeGuideDialogContent(product: {
  handle: string
  title: string
}): ProductSizeGuideContent {
  const family = resolveProductSizeGuideFamily(product.handle)
  const content = getProductSizeGuideContent(family)
  const name = productTitle(product)

  return {
    ...content,
    badge: name,
    title: 'Størrelsesguide',
    ...(family === 'techdown' ? {
      description: 'Velg mellom Middels, Stor og Større. Start med høyderådet, og sammenlign gjerne målene med et plagg du allerede har. Alle mål er i centimeter.',
      tableAriaLabel: `Måletabell for ${product.handle === 'utekos-svale' ? 'Svale' : 'TechDown'}-størrelser`,
      tableCaption: `Mål for ${name} i Middels, Stor og Større`
    } : {})
  }
}
