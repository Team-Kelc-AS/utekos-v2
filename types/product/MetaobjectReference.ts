// Path: src/types/product/MetaobjectReference.ts
import type { Image } from 'types/media'

export type MetaobjectReference = {
  images: Image[]
  subtitle: MetaobjectField
  colorLabel: MetaobjectField
  backgroundColor: MetaobjectField
  swatchHexcolorForVariant: MetaobjectField
  swatchHexcolorForUnselectedVariant: MetaobjectField
  length: MetaobjectField
  centerToWrist: MetaobjectField
  flatWidth: MetaobjectField
}

export type MetaobjectField = {
  value: string | null
}

export type RawMetaobjectFieldKey =
  | 'images'
  | 'subtitle'
  | 'colorLabel'
  | 'backgroundColor'
  | 'swatchHexcolorForVariant'
  | 'swatchHexcolorForUnselectedVariant'
  | 'length'
  | 'centerToWrist'
  | 'flatWidth'

export type RawMetaobject = {
  fields?: RawField[] | null
} & Partial<Record<RawMetaobjectFieldKey, RawField | null>>

export type VariantMetaobject = MetaobjectReference | null

export type RawField = {
  key: string
  value: string | null
  type?: string | null
  references?: {
    nodes: MetaobjectNode[]
  } | null
}

export type MetaobjectNode = {
  image: Image | null
}
