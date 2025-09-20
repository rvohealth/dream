import round, { RoundingPrecision } from './round.js'

/**
 * Calculates the percentage from a numerator and denominator, optionally rounding to a specified precision.
 *
 * Examples:
 *   percent(1, 4) // 25
 *   percent(1, 0) // 0
 *   percent(1, 3, 4) // 33.3333
 *
 * @param numerator - The numerator value
 * @param denominator - The denominator value
 * @param precision - Optional number of decimal places to round to
 * @returns The percentage value, rounded if precision is provided
 */
export default function percent(numerator: number, denominator: number, precision?: RoundingPrecision) {
  if (!numerator || !denominator) return 0
  const percent = (numerator / denominator) * 100
  return precision ? round(percent, precision) : percent
}
