import { ToISOTimeDurationOptions } from 'luxon'
import { DateTime } from '../DateTime.js'
import { Duration } from '../Duration.js'
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
