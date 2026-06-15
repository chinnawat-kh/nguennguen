import { type Transaction, type FilterMode } from './types'

export function getCurrentDay(): string {
  return new Date().toISOString().substring(0, 10)
}

export function getCurrentMonth(): string {
  return new Date().toISOString().substring(0, 7)
}

export function getCurrentYear(): string {
  return new Date().toISOString().substring(0, 4)
}

export function getWeekStart(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  return monday.toISOString().substring(0, 10)
}

export function getWeekEnd(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return sunday.toISOString().substring(0, 10)
}

export function formatDisplayDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

export function parseDisplayDate(dmy: string): string {
  const parts = dmy.split('/')
  if (parts.length !== 3) return dmy
  const [d, m, y] = parts
  if (!d || !m || !y || y.length !== 4) return dmy
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

export function filterByMode(transactions: Transaction[], mode: FilterMode): Transaction[] {
  const day = getCurrentDay()
  const month = getCurrentMonth()
  const year = getCurrentYear()
  const weekStart = getWeekStart()
  const weekEnd = getWeekEnd()

  switch (mode) {
    case 'daily':
      return transactions.filter((tx) => tx.date.startsWith(day))
    case 'weekly':
      return transactions.filter((tx) => tx.date >= weekStart && tx.date <= weekEnd)
    case 'monthly':
      return transactions.filter((tx) => tx.date.startsWith(month))
    case 'yearly':
      return transactions.filter((tx) => tx.date.startsWith(year))
  }
}
