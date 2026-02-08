import { Duration } from '../Duration.js'

export default function isoTimeDecimalStringForDuration(
  duration: Duration,
  { nullIfZero }: { nullIfZero: boolean | undefined }
) {
  /**
   * `fromMillis` in Luxon Duration does not carry over from milliseconds to
   * higher values, so the milliseconds returned may be greater than 1000,
   * even though the output in various forms will be correct (e.g., `toISO`
   * will export the number of seconds.
   *
   * E.g.:
   *
   * ```
   * const luxonDuration = LuxonDuration.fromMillis(1000)
   * console.debug({
   *   'luxonDuration.seconds': luxonDuration.seconds,
   *   'luxonDuration.milliseconds': luxonDuration.milliseconds,
   * })
   *
   * // {
   * //   'luxonDuration.seconds': 0,
   * //   'luxonDuration.milliseconds': 1000
   * // }
   * ```
   *
   * Due to this, we use the modulus operator to strip the seconds component from milliseconds
   */
  const microseconds = (duration.milliseconds % 1000) * 1000 + duration.microseconds
  return microseconds === 0 && nullIfZero ? null : microseconds.toString().padStart(6, '0')
}
