type RecordValue = Record<string, unknown>

function object(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Invalid ${label}`)
  return value as RecordValue
}

export function positiveId(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) <= 0) throw new Error('Invalid id')
  return value as number
}

export function month(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    throw new Error('Invalid month')
  }
  return value
}

export function clientId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length > 300 ||
    !value.endsWith('.apps.googleusercontent.com')
  ) {
    throw new Error('Invalid Google Client ID')
  }
  return value
}

export function transaction(value: unknown, withId = false): RecordValue {
  const data = object(value, 'transaction')
  if (withId) positiveId(data.id)
  if (data.type !== 'income' && data.type !== 'expense') throw new Error('Invalid transaction type')
  if (typeof data.amount !== 'number' || !Number.isFinite(data.amount) || data.amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }
  positiveId(data.category_id)
  if (typeof data.date !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(data.date)) {
    throw new Error('Invalid transaction date')
  }
  if (data.note != null && (typeof data.note !== 'string' || data.note.length > 500)) {
    throw new Error('Note is too long')
  }
  return data
}

export function category(value: unknown, withId = false): RecordValue {
  const data = object(value, 'category')
  if (withId) positiveId(data.id)
  if (data.type !== 'income' && data.type !== 'expense') throw new Error('Invalid category type')
  if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 100) {
    throw new Error('Invalid category name')
  }
  if (typeof data.icon !== 'string' || data.icon.length > 50)
    throw new Error('Invalid category icon')
  if (typeof data.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(data.color)) {
    throw new Error('Invalid category color')
  }
  return data
}

export function budget(value: unknown): RecordValue {
  const data = object(value, 'budget')
  month(data.month)
  if (typeof data.amount !== 'number' || !Number.isFinite(data.amount) || data.amount < 0) {
    throw new Error('Invalid budget amount')
  }
  return data
}
