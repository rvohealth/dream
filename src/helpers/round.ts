/**
 * Rounds a number to a specified decimal precision.
 *
 * Examples:
 *   round(0.5, 0) // 1
 *   round(0.4, 0) // 0
 *   round(0.15, 1) // 0.2
 *   round(0.14, 1) // 0.1
 *   round(0.1234, 2) // 0.12
 *
 * @param num - The number to round
 * @param precision - The number of decimal places to round to (default: 0)
 * @returns The rounded number
 */
export default function round(num: number, precision: RoundingPrecision = 0) {
  const multiplier = Math.pow(10, precision) || 1
  return Math.round(num * multiplier) / multiplier
}

export type RoundingPrecision = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
