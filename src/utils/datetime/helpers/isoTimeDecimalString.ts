import { DateTime } from '../DateTime.js'

export default function isoTimeDecimalString(
  datetime: DateTime,
  { nullIfZero }: { nullIfZero: boolean | undefined }
) {
  const milliseconds = datetime.millisecond
  const microseconds = datetime.microsecond
  const totalMicroseconds = milliseconds * 1000 + microseconds

  return totalMicroseconds === 0 && nullIfZero ? null : totalMicroseconds.toString().padStart(6, '0')
}
