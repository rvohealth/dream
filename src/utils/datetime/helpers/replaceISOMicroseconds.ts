import type { DateTime } from '../DateTime.js'
import isoTimeDecimalString from './isoTimeDecimalString.js'

export default function replaceISOMicroseconds(
  timeObj: DateTime,
  isoString: string,
  opts: { truncateMicroseconds?: boolean; suppressMilliseconds?: boolean } | undefined
) {
  const decimalString = isoTimeDecimalString(timeObj, {
    nullIfZero: opts?.suppressMilliseconds,
    truncateMicroseconds: opts?.truncateMicroseconds,
  })

  if (decimalString === null) return isoString

  // Match time in both ISO format (with T) and SQL format (with space)
  // Matches: "T12:34:56.123" or " 12:34:56.123" or "12:34:56.123" at start
  const regexp = /((?:^|T| )\d\d(?::\d\d){1,2})(?:\.\d+)?/
  return isoString.replace(regexp, '$1.' + decimalString)
}
