export type CurrencyCode =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'SGD'
  | 'THB'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'IDR'
  | 'MYR'
  | 'VND'

export interface CurrencyDefinition {
  code: CurrencyCode
  symbol: string
  name: string
  defaultRateToINR: number // 1 Unit of Foreign Currency = X INR
  decimals: number
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyDefinition> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', defaultRateToINR: 1, decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', defaultRateToINR: 83.5, decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', defaultRateToINR: 90.5, decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', defaultRateToINR: 106.0, decimals: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', defaultRateToINR: 22.75, decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', defaultRateToINR: 62.0, decimals: 2 },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', defaultRateToINR: 2.35, decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', defaultRateToINR: 0.55, decimals: 0 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', defaultRateToINR: 61.2, decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', defaultRateToINR: 54.8, decimals: 2 },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', defaultRateToINR: 0.0053, decimals: 0 },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', defaultRateToINR: 17.8, decimals: 2 },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', defaultRateToINR: 0.0034, decimals: 0 },
}

export const ALL_CURRENCY_CODES = Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]
