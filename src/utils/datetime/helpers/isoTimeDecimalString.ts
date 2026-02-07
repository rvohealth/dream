import { DateTime } from '../DateTime.js'

export default function isoTimeDecimalString(
  datetime: DateTime,
  {
    nullIfZero,
    truncateMicroseconds,
  }: { nullIfZero?: boolean | undefined; truncateMicroseconds?: boolean | undefined }
) {
  const milliseconds = datetime.millisecond

  if (truncateMicroseconds) {
    if (nullIfZero && milliseconds === 0) return null
    return milliseconds.toString().padStart(3, '0')
  }

  const totalMicroseconds = milliseconds * 1000 + datetime.microsecond

  if (nullIfZero && totalMicroseconds === 0) return null

  return totalMicroseconds.toString().padStart(6, '0')
}
