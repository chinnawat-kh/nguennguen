import type { Transaction, FilterMode, TransactionFilterMode } from './types'

export function filterTransactionDates(
  transactions: Transaction[],
  mode: TransactionFilterMode,
  from = '',
  to = ''
): Transaction[] {
  if (mode === 'all') return [...transactions]
  if (mode !== 'custom') return filterByMode(transactions, mode)
  if ((from && !isValidISODate(from)) || (to && !isValidISODate(to)) || (from && to && from > to))
    return []
  return transactions.filter((tx) => (!from || tx.date >= from) && (!to || tx.date <= to))
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getCurrentDay(): string {
  return formatLocalDate(new Date())
}

export function getCurrentMonth(): string {
  return getCurrentDay().substring(0, 7)
}

export function getCurrentYear(): string {
  return String(new Date().getFullYear())
}

export function getWeekStart(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  return formatLocalDate(monday)
}

export function getWeekEnd(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return formatLocalDate(sunday)
}

export function formatDisplayDate(iso: string): string {
  if (!iso) return ''
  if (!isValidISODate(iso)) return iso
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1 || month < 1 || month > 12 || day < 1) return false
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= days[month - 1]
}

export function parseDisplayDate(dmy: string): string {
  dmy = dmy.trim()
  const parts = dmy.split('/')
  if (parts.length !== 3) return dmy
  const [d, m, y] = parts
  if (!d || !m || !y || y.length !== 4) return dmy
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  return isValidISODate(iso) ? iso : dmy
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
