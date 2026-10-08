// Path: types/product/MetaField.ts
import type { RawMetaobject } from './MetaobjectReference'

export type Metafield = {
  namespace: string
  key: string
  reference: RawMetaobject | null
}
