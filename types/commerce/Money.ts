// Path: types/commerce/Money.ts

import type { CurrencyCode } from './CurrencyCode'

export type Money = {
  amount: string
  currencyCode: CurrencyCode
}
