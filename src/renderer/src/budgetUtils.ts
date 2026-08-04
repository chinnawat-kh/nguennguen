import type { FilterMode } from './types'

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function calculatePeriodBudget(
  monthlyBudget: number,
  mode: FilterMode,
  referenceDate = new Date(),
  weekStart?: string,
  weekEnd?: string
): number {
  if (mode === 'monthly') return monthlyBudget
  if (mode === 'yearly') return monthlyBudget * 12
  if (mode === 'daily') return monthlyBudget / getDaysInMonth(referenceDate)

  if (!weekStart || !weekEnd) throw new Error('Week boundaries are required')
  const end = new Date(`${weekEnd}T12:00:00`)
  const cursor = new Date(`${weekStart}T12:00:00`)
  let weeklyBudget = 0
  while (cursor <= end) {
    weeklyBudget += monthlyBudget / getDaysInMonth(cursor)
    cursor.setDate(cursor.getDate() + 1)
  }
  return weeklyBudget
}
