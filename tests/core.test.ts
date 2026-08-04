import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeByKey } from '../src/main/merge.ts'
import { budget, category, month, positiveId, transaction } from '../src/main/validation.ts'
import { filterByMode, formatDisplayDate, parseDisplayDate } from '../src/renderer/src/dateUtils.ts'
import { fromSatang, toSatang } from '../src/shared/money.ts'
import { calculatePeriodBudget } from '../src/renderer/src/budgetUtils.ts'

test('merge keeps the most recently updated record and tombstones', () => {
  const local = [{ sync_id: 'a', value: 1, updated_at: '2026-08-01T00:00:00Z' }]
  const remote = [
    { sync_id: 'a', value: 2, updated_at: '2026-08-02T00:00:00Z', deleted_at: '2026-08-02' }
  ]
  const merged = mergeByKey(local, remote, (item) => item.sync_id)
  assert.equal(merged[0].value, 2)
  assert.equal(merged[0].deleted_at, '2026-08-02')
})

test('IPC validators accept valid records and reject unsafe values', () => {
  assert.equal(positiveId(1), 1)
  assert.equal(month('2026-08'), '2026-08')
  assert.doesNotThrow(() =>
    transaction({ type: 'expense', amount: 10.5, category_id: 1, date: '2026-08-03', note: '' })
  )
  assert.doesNotThrow(() =>
    category({ name: 'Food', type: 'expense', icon: 'Tag', color: '#ffffff' })
  )
  assert.doesNotThrow(() => budget({ month: '2026-08', amount: 100 }))
  assert.throws(() =>
    transaction({ type: 'expense', amount: -1, category_id: 1, date: '2026-08-03' })
  )
  assert.throws(() => month('2026-13'))
})

test('date display conversion and filtering use ISO calendar dates', () => {
  assert.equal(formatDisplayDate('2026-08-03'), '03/08/2026')
  assert.equal(parseDisplayDate('3/8/2026'), '2026-08-03')
  const records = [
    { id: 1, type: 'expense' as const, amount: 1, category_id: null, date: '1999-01-01' }
  ]
  assert.deepEqual(filterByMode(records, 'yearly'), [])
})

test('money is rounded and stored as integer satang', () => {
  assert.equal(toSatang(10.01), 1001)
  assert.equal(toSatang(0.1 + 0.2), 30)
  assert.equal(fromSatang(12345), 123.45)
  assert.throws(() => toSatang(Number.NaN))
  assert.throws(() => fromSatang(1.5))
})

test('budget periods are prorated from the monthly budget', () => {
  const monthlyBudget = 31000
  assert.equal(calculatePeriodBudget(monthlyBudget, 'daily', new Date(2026, 0, 15)), 1000)
  assert.equal(calculatePeriodBudget(monthlyBudget, 'monthly'), monthlyBudget)
  assert.equal(calculatePeriodBudget(monthlyBudget, 'yearly'), monthlyBudget * 12)

  const crossMonthWeek = calculatePeriodBudget(
    monthlyBudget,
    'weekly',
    new Date(2026, 0, 30),
    '2026-01-29',
    '2026-02-04'
  )
  assert.ok(Math.abs(crossMonthWeek - (3000 + (monthlyBudget / 28) * 4)) < 0.000001)
})
