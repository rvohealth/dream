export default function round(num: number, precision: RoundingPrecision = 0) {
  const multiplier = Math.pow(10, precision) || 1
  return Math.round(num * multiplier) / multiplier
}

export type RoundingPrecision = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
