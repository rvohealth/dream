import { DateTime } from '../DateTime.js'
import { Duration } from '../Duration.js'

export default function isoTimeDecimalString(
  timeObj: DateTime | Duration,
  { nullIfZero }: { nullIfZero: boolean | undefined }
) {
  const milliseconds = timeObj instanceof DateTime ? timeObj.millisecond : timeObj.milliseconds
  const microseconds = timeObj instanceof DateTime ? timeObj.microsecond : timeObj.microseconds
  const totalMicroseconds = milliseconds * 1000 + microseconds

  return totalMicroseconds === 0 && nullIfZero ? null : totalMicroseconds.toString().padStart(6, '0')
}
