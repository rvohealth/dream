import { InvalidDateTime, MICROSECONDS_MIN } from '../DateTime.js'

/**
 * Normalizes a microsecond value: values > 999 become whole milliseconds + remainder (0–999).
 * Throws for negative.
 */

export function microsecondParts(microsecondInput: number): {
  milliseconds: number
  microseconds: number
} {
  if (microsecondInput < MICROSECONDS_MIN) {
    throw new InvalidDateTime(
      new Error(`microsecond must be a non-negative integer, got: ${String(microsecondInput)}`)
    )
  }

  const totalMicroseconds = Math.round(microsecondInput)
  const milliseconds = Math.floor(totalMicroseconds / 1000)

  return {
    milliseconds,
    microseconds: totalMicroseconds - milliseconds * 1000,
  }
}
