import { slugifyVariantOption } from '@/lib/products/slugifyVariantOption'

export const TECH_DOWN_SIZES = [
  {
    size: 'Liten',
    id: 'liten',
    sizeCode: 'S',
    aliases: ['small', 's'],
    heightGuide: '155–165 cm (evt. opptil 165 cm)',
    fitGuidance: [
      'Du ligger i øvre sjiktet (mot 165 cm) og ønsker en mer kroppsnær passform.'
    ]
  },
  {
    size: 'Middels',
    id: 'middels',
    sizeCode: 'M',
    aliases: ['medium', 'm'],
    heightGuide: '165–175 cm',
    fitGuidance: [
      'Du er mellom 165–175 cm og ønsker en romslig passform.',
      'Du ligger i øvre sjiktet (mot 175 cm) og ønsker en mer kroppsnær passform.'
    ],
    measurements: {
      length: '162 cm',
      chest: '56 cm',
      armCenter: '82 cm'
    }
  },
  {
    size: 'Stor',
    id: 'stor',
    sizeCode: 'L',
    aliases: ['large', 'l'],
    heightGuide: '175–185 cm',
    fitGuidance: [
      'Du er mellom 175–185 cm og ønsker romslighet.',
      'Du ligger i øvre sjiktet (mot 185 cm) og ønsker en mer kroppsnær passform.'
    ],
    measurements: {
      length: '166 cm',
      chest: '58 cm',
      armCenter: '87 cm'
    }
  },
  {
    size: 'Større',
    id: 'storre',
    sizeCode: 'XL',
    aliases: ['ekstra stor', 'extra large', 'xl'],
    heightGuide: '185 cm og høyere',
    fitGuidance: [
      'Du er over 185 cm.',
      'Du er lavere, men kraftig bygget og ønsker ekstra romslighet.'
    ],
    measurements: {
      length: '170 cm',
      chest: '61 cm',
      armCenter: '92 cm'
    }
  }
] as const

export type TechDownSize =
  (typeof TECH_DOWN_SIZES)[number]['size']

const measuredSizes = TECH_DOWN_SIZES.filter(size => 'measurements' in size)

export const TECH_DOWN_SIZE_VALUE_MAP: Readonly<
  Record<string, TechDownSize>
> = Object.fromEntries(
  TECH_DOWN_SIZES.flatMap(size =>
    [size.id, ...size.aliases].map(alias => [alias, size.size])
  )
)

export function resolveTechDownSizeValue(
  rawValue: string
): TechDownSize | null {
  return (
    TECH_DOWN_SIZE_VALUE_MAP[
      slugifyVariantOption(rawValue).replaceAll('-', ' ')
    ] ?? null
  )
}

const measurementLabels = {
  length: 'Lengde',
  chest: 'Bryst',
  armCenter: 'Ermlengde'
} as const satisfies Record<
  keyof (typeof measuredSizes)[number]['measurements'],
  string
>

export const TECH_DOWN_MEASUREMENT_COLUMNS = (
  Object.entries(measurementLabels) as [
    keyof typeof measurementLabels,
    (typeof measurementLabels)[keyof typeof measurementLabels]
  ][]
).map(([key, label]) => ({ key, label }))

/** One row per measurement — used by text/NBCC facts. */
export const TECH_DOWN_MEASUREMENT_ROWS = Object.entries(
  measurementLabels
).map(([key, measurement]) => ({
  measurement,
  values: measuredSizes.map(
    size =>
      size.measurements[key as keyof typeof measurementLabels]
  )
}))

/** One row per size — used by visible size charts. */
export const TECH_DOWN_SIZE_ROWS =
  measuredSizes.map(size => ({
    size: size.size,
    values: TECH_DOWN_MEASUREMENT_COLUMNS.map(
      column => size.measurements[column.key]
    )
  }))
