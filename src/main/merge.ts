export function updatedTime(value?: string): number {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function mergeByKey<T extends { updated_at?: string }>(
  local: T[],
  remote: T[],
  key: (item: T) => string | number
): T[] {
  const merged = new Map<string | number, T>()
  for (const item of remote) merged.set(key(item), item)
  for (const item of local) {
    const existing = merged.get(key(item))
    if (!existing || updatedTime(item.updated_at) >= updatedTime(existing.updated_at)) {
      merged.set(key(item), item)
    }
  }
  return [...merged.values()]
}
