import { DateTime } from '../../../../src/helpers/DateTime.js'
import { Duration } from '../../../../src/helpers/Duration.js'

export default function totalMicroseconds(timeObj: DateTime | Duration) {
  const milliseconds = timeObj instanceof DateTime ? timeObj.millisecond : timeObj.milliseconds
  const microseconds = timeObj instanceof DateTime ? timeObj.microsecond : timeObj.microseconds

  return milliseconds * 1000 + microseconds
}
