export function toSatang(amount: number): number {
  if (!Number.isFinite(amount)) throw new Error('Invalid money amount')
  return Math.round((amount + Number.EPSILON) * 100)
}

export function fromSatang(satang: number): number {
  if (!Number.isSafeInteger(satang)) throw new Error('Invalid satang amount')
  return satang / 100
}
