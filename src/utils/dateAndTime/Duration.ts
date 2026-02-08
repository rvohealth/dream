import type {
  DurationObjectUnits,
  DurationOptions,
  DurationLikeObject as LuxonDurationLikeObject,
  DurationUnit as LuxonDurationUnit,
  ToISOTimeDurationOptions,
} from 'luxon'
import { Duration as LuxonDuration } from 'luxon'
import { InvalidDateTime, microsecondParts } from './DateTime.js'
import replaceISOMicroseconds from './helpers/replaceISOMicroseconds.js'
import totalMicroseconds from './helpers/totalMicroseconds.js'

/**
 * Duration extends Luxon Duration with microsecond precision (0-999).
 * Sub-second in ISO/time strings uses 6 decimal places: first 3 = milliseconds, next 3 = microseconds.
 */
// @ts-expect-error TS2345 - Luxon Duration constructor is private; we extend for microsecond support
export class Duration extends LuxonDuration {
  protected readonly _microseconds: number

  /**
   * Microsecond part of the Duration (NOT microseconds since Unix epoch)
   *
   * This value will not exceed 999 because above that will carry over to the
   * milliseconds part of the Duration
   *
   * @returns The microsecond of the second (0–999)
   */
  public get microseconds(): number {
    return this._microseconds
  }

  protected constructor(config: unknown, microseconds: number = 0) {
    super(config as Record<string, unknown>)
    this._microseconds = microseconds
  }

  /**
   * Wraps a Luxon Duration with our Duration, attaching the given microsecond component.
   * @internal
   * @param luxonDuration - The Luxon Duration instance
   * @param microseconds - Microsecond component (0–999)
   * @returns A Duration wrapping the Luxon instance with microsecond support
   */
  private static wrap(luxonDuration: LuxonDuration, microseconds: number): Duration {
    const config = configFromLuxon(luxonDuration)
    return new Duration(config, microseconds)
  }

  /**
   * Create a Duration from a count of milliseconds.
   * @param count - Number of milliseconds
   * @param opts - Optional duration options
   * @returns A Duration
   * @example
   * ```ts
   * Duration.fromMillis(1500)
   * ```
   */
  public static override fromMillis(count: number, opts?: DurationOptions): Duration {
    const luxonDuration = LuxonDuration.fromMillis(count, opts)
    return Duration.wrap(luxonDuration, 0)
  }

  /**
   * Create a Duration from an object with duration units.
   * @param obj - Object with hours, minutes, seconds, milliseconds, microsecond/microseconds, etc.
   * @param opts - Optional duration options
   * @returns A Duration
   * @example
   * ```ts
   * Duration.fromObject({ hours: 2, minutes: 30, microseconds: 500 })
   * ```
   */
  public static override fromObject(obj: DurationLikeObject, opts?: DurationOptions): Duration {
    const { microseconds, microsecond, ...rest } = obj
    delete (rest as Record<string, unknown>).microsecond
    delete (rest as Record<string, unknown>).microseconds

    const { milliseconds, microseconds: normalizedMicroseconds } = microsecondPartsForDuration(
      microseconds ?? microsecond ?? 0
    )
    const luxonDuration = wrapLuxonError(() => LuxonDuration.fromObject(rest, opts))

    return Duration.wrap(
      milliseconds > 0 ? luxonDuration.plus({ milliseconds }) : luxonDuration,
      normalizedMicroseconds
    )
  }

  /**
   * Create a Duration from total microseconds.
   * @param totalMicros - Total microseconds (milliseconds from quotient, microsecond from remainder)
   * @param opts - Optional duration options
   * @returns A Duration
   * @example
   * ```ts
   * Duration.fromMicroseconds(1500500)  // 1.5s + 500µs
   * ```
   */
  public static fromMicroseconds(totalMicros: number, opts?: DurationOptions): Duration {
    const milliseconds = Math.floor(totalMicros / 1000)
    const microseconds = totalMicros - milliseconds * 1000
    const luxonDuration = LuxonDuration.fromMillis(milliseconds, opts)
    return Duration.wrap(luxonDuration, microseconds)
  }

  /**
   * Create a Duration from an ISO 8601 duration string.
   * @param text - ISO string (e.g. "PT1.500500S"); parses up to 6 fractional second digits
   * @param opts - Optional parsing options
   * @returns A Duration
   * @example
   * ```ts
   * Duration.fromISO('PT1.500500S')   // 1.500500 seconds
   * Duration.fromISO('PT2H30M')
   * ```
   */
  public static override fromISO(text: string, opts?: DurationOptions): Duration {
    const luxonDuration = wrapLuxonError(() => LuxonDuration.fromISO(text, opts))
    const { microsecond } = parseFractionalPart(text)
    return Duration.wrap(luxonDuration, microsecond)
  }

  /**
   * Create a Duration from an ISO time string.
   * @param text - Time string (e.g. "10:30:45.123456"); parses up to 6 fractional second digits
   * @param opts - Optional parsing options
   * @returns A Duration
   * @example
   * ```ts
   * Duration.fromISOTime('10:30:45.123456')
   * ```
   */
  public static override fromISOTime(text: string, opts?: DurationOptions): Duration {
    const luxonDuration = wrapLuxonError(() => LuxonDuration.fromISOTime(text, opts))
    const { microsecond } = parseFractionalPart(text)
    return Duration.wrap(luxonDuration, microsecond)
  }

  /**
   * Converts a DurationLike to a Duration.
   * @param duration - A Duration instance, DurationLikeObject, or milliseconds number
   * @returns A Duration
   * @example
   * ```ts
   * Duration.fromDurationLike({ hours: 2 })
   * Duration.fromDurationLike(3600000)
   * Duration.fromDurationLike(existingDuration)
   * ```
   */
  public static override fromDurationLike(duration: DurationLike): Duration {
    if (duration instanceof Duration) return duration
    if (typeof duration === 'number') return Duration.fromMillis(duration)
    return Duration.fromObject(duration)
  }

  /**
   * Returns an object with duration units including microseconds.
   * @returns Object with years, days, hours, minutes, seconds, milliseconds, microseconds
   * @example
   * ```ts
   * Duration.fromObject({ hours: 2, microseconds: 500 }).toObject()
   * ```
   */
  public override toObject(): DurationObject {
    const obj = super.toObject() as DurationObject
    obj.microseconds = this.microseconds
    return obj
  }

  /**
   * Returns an ISO 8601 duration string with 6 fractional second digits when sub-second present.
   * @returns ISO string (e.g. "PT1.500500S")
   * @example
   * ```ts
   * Duration.fromObject({ seconds: 1, microseconds: 500500 }).toISO()
   * ```
   */
  public override toISO(): string {
    const isoString = super.toISO()
    const microseconds = totalMicroseconds(this)
    if (microseconds === 0) return isoString
    const microsecondString = microseconds.toString().padStart(6, '0')
    const regexp = /(\d+)(?:\.\d+)?S$/i
    if (regexp.test(isoString)) return isoString.replace(regexp, `$1.${microsecondString}S`)
    return `${isoString}0.${microsecondString}S`
  }

  /**
   * Returns the time portion in ISO format with 6 fractional second digits.
   * @param opts - Optional format options
   * @returns Time string (e.g. "10:30:45.123456")
   * @example
   * ```ts
   * Duration.fromObject({ hours: 10, minutes: 30, seconds: 45, microseconds: 123456 }).toISOTime()
   * ```
   */
  public override toISOTime(opts?: ToISOTimeDurationOptions): string {
    return replaceISOMicroseconds(this, super.toISOTime(opts), opts)
  }

  /**
   * Returns total duration in microseconds.
   * @returns Total microseconds (milliseconds * 1000 + microsecond component)
   * @example
   * ```ts
   * Duration.fromMicroseconds(1500500).toMicroseconds()  // 1500500
   * ```
   */
  public toMicroseconds(): number {
    return this.toMillis() * 1000 + this.microseconds
  }

  /**
   * Returns the value of the given unit.
   * @param unit - Unit name (years, days, hours, minutes, seconds, milliseconds, microseconds/microsecond)
   * @returns The numeric value for that unit
   * @example
   * ```ts
   * Duration.fromObject({ hours: 2, minutes: 30 }).get('hours')  // 2
   * Duration.fromObject({ microseconds: 500 }).get('microseconds')  // 500
   * ```
   */
  public override get(unit: DurationUnit): number {
    if (unit === 'microseconds' || unit === 'microsecond') return this.microseconds
    return super.get(unit as LuxonDurationUnit)
  }

  /**
   * Adds a duration to this Duration. Supports microsecond via Duration or DurationLikeObject.
   * @param duration - Duration to add
   * @returns A new Duration
   * @example
   * ```ts
   * Duration.fromObject({ hours: 2 }).plus({ minutes: 30 })
   * Duration.fromObject({ seconds: 1, microseconds: 500 }).plus(Duration.fromMicroseconds(600))
   * ```
   */
  // @ts-expect-error TS2416 - return type Duration not assignable to base this
  public override plus(duration: DurationLike): Duration {
    const otherDuration = Duration.fromDurationLike(duration)
    const { milliseconds, microseconds } = microsecondParts(this.microseconds + otherDuration.microseconds)
    const newLuxonDuration = super.plus(otherDuration)

    return Duration.wrap(
      milliseconds > 0 ? newLuxonDuration.plus({ milliseconds }) : newLuxonDuration,
      microseconds
    )
  }

  /**
   * Subtracts a duration from this Duration.
   * @param duration - Duration to subtract
   * @returns A new Duration
   * @example
   * ```ts
   * Duration.fromObject({ hours: 3 }).minus({ hours: 1 })
   * ```
   */
  // @ts-expect-error TS2416 - return type Duration not assignable to base this
  public override minus(duration: DurationLike): Duration {
    const otherDuration = Duration.fromDurationLike(duration)
    return this.plus(Duration.fromMicroseconds(-otherDuration.toMicroseconds()))
  }

  /**
   * Returns a new Duration with the given units set.
   * @param values - Object with units to set (supports microsecond/microseconds)
   * @returns A new Duration
   * @example
   * ```ts
   * Duration.fromObject({ hours: 2 }).set({ minutes: 45, microseconds: 123 })
   * ```
   */
  // @ts-expect-error TS2416 - return type Duration not assignable to base this
  public override set(values: DurationLikeObject): Duration {
    const { microseconds, microsecond, ...rest } = values
    // Duration values are in plural form. Convert the supplied
    // values to the plural form so they override current values.
    const luxonDuration = super.set(singularToPlural(rest))

    const { milliseconds, microseconds: normalizedMicroseconds } = microsecondPartsForDuration(
      microseconds ?? microsecond ?? this.microseconds
    )

    return Duration.wrap(
      milliseconds > 0 ? luxonDuration.plus({ milliseconds }) : luxonDuration,
      normalizedMicroseconds
    )
  }
}

function microsecondPartsForDuration(value: number): { milliseconds: number; microseconds: number } {
  try {
    return microsecondParts(value)
  } catch (error) {
    if (error instanceof InvalidDateTime) throw new InvalidDuration(new Error(error.message))
    throw error
  }
}

function wrapLuxonError<T>(fn: () => T): T {
  try {
    return fn()
  } catch (error) {
    if (error instanceof Error) throw new InvalidDuration(error)
    throw error
  }
}

/** Extends Luxon's DurationLikeObject with microsecond support. */
export interface DurationLikeObject extends LuxonDurationLikeObject {
  microsecond?: number
  microseconds?: number
}

/** Extends Luxon's duration units with microsecond. Use for get(unit), set(), etc. */
export type DurationUnit = keyof DurationLikeObject

/** Extends Luxon's DurationLike: our Duration, our DurationLikeObject, or number (ms). */
export type DurationLike = Duration | DurationLikeObject | number

/** Object from toObject() including microseconds. */
export type DurationObject = DurationObjectUnits & { microseconds?: number }

const SINGULAR_TO_PLURAL: [keyof DurationLikeObject, keyof DurationObjectUnits][] = [
  ['year', 'years'],
  ['quarter', 'quarters'],
  ['month', 'months'],
  ['week', 'weeks'],
  ['day', 'days'],
  ['hour', 'hours'],
  ['minute', 'minutes'],
  ['second', 'seconds'],
  ['millisecond', 'milliseconds'],
]

/** Convert user's DurationLikeObject (singular or plural keys) to DurationObjectUnits (plural only) for Luxon. */
function singularToPlural(
  obj: Omit<DurationLikeObject, 'microsecond' | 'microseconds'>
): DurationObjectUnits {
  const result: Record<string, number> = {}
  const o = obj as Record<string, number | undefined>
  for (const [singular, plural] of SINGULAR_TO_PLURAL) {
    const val = o[plural] ?? o[singular]
    if (val !== undefined) result[plural] = val
  }
  return result as DurationObjectUnits
}

/** Build internal config from a Luxon Duration so we can pass it to super() */
function configFromLuxon(dur: LuxonDuration): Record<string, unknown> {
  const d = dur as unknown as {
    values: Record<string, number>
    loc: unknown
    conversionAccuracy: string
    matrix: unknown
    invalid: unknown
  }
  return {
    values: d.values,
    loc: d.loc,
    conversionAccuracy: d.conversionAccuracy,
    matrix: d.matrix,
    invalid: d.invalid,
  }
}

/** Parse fractional part from ISO duration S or time string: first 3 digits = ms, next 3 = µs */
function parseFractionalPart(str: string): { millisecond: number; microsecond: number } {
  const match = str.match(/[.,](\d+)(?:S)?$/)
  if (!match) return { millisecond: 0, microsecond: 0 }
  const frac = (match[1] ?? '').padEnd(6, '0').slice(0, 6)
  return {
    millisecond: parseInt(frac.slice(0, 3), 10),
    microsecond: parseInt(frac.slice(3, 6), 10),
  }
}

/**
 * Thrown when a Duration is invalid (e.g. invalid input or Luxon error).
 * @param error - The original error (available as cause)
 * @example
 * ```ts
 * try {
 *   Duration.fromISO('invalid')
 * } catch (e) {
 *   if (e instanceof InvalidDuration) console.error(e.cause)
 * }
 * ```
 */
export class InvalidDuration extends Error {
  public constructor(error: Error) {
    super(error.message ?? '')
    this.name = 'InvalidDuration'
    this.cause = error
  }
}
