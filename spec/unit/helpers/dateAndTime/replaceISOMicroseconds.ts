import { ToISOTimeDurationOptions } from 'luxon'
import { DateTime } from '../../../../src/helpers/DateTime.js'
import { Duration } from '../../../../src/helpers/Duration.js'
import totalMicroseconds from './totalMicroseconds.js'

export default function replaceISOMicroseconds(
  timeObj: DateTime | Duration,
  isoString: string,
  opts: ToISOTimeDurationOptions | undefined
) {
  const microseconds = totalMicroseconds(timeObj)
  if (microseconds === 0 && opts?.suppressMilliseconds) return isoString

  const regexp = /((?:^|T)\d\d(?::\d\d){1,2})(?:\.\d+)?/
  return isoString.replace(regexp, '$1.' + microseconds.toString().padStart(6, '0'))
}
