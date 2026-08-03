export function formatCurrency(value: number, lang: 'en' | 'th' = 'th'): string {
  return new Intl.NumberFormat(lang === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}
