import round, { RoundingPrecision } from './round.js'

export default function percent(numerator: number, denominator: number, precision?: RoundingPrecision) {
  if (!numerator || !denominator) return 0
  const percent = (numerator / denominator) * 100
  return precision ? round(percent, precision) : percent
}
