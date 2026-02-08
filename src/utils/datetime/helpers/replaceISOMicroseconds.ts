import { ToISOTimeDurationOptions } from 'luxon'
import { DateTime } from '../DateTime.js'
import { Duration } from '../Duration.js'
import isoTimeDecimalString from './isoTimeDecimalString.js'

export default function replaceISOMicroseconds(
  timeObj: DateTime | Duration,
  isoString: string,
  opts: ToISOTimeDurationOptions | undefined
) {
  const decimalString = isoTimeDecimalString(timeObj, { nullIfZero: opts?.suppressMilliseconds })
  if (decimalString === null) return isoString

  const regexp = /((?:^|T)\d\d(?::\d\d){1,2})(?:\.\d+)?/
  return isoString.replace(regexp, '$1.' + decimalString.toString().padStart(6, '0'))
}
