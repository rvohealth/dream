import { DateObjectUnits, DateTimeJSOptions, DateTimeUnit, LocaleOptions } from '../types/luxon/datetime.js'
import { DurationLikeObject, DurationObjectUnits } from '../types/luxon/duration.js'
import { DateTimeFormatOptions } from '../types/luxon/misc.js'
import { Zone } from '../types/luxon/zone.js'
import { DateTime } from './DateTime.js'

type CalendarDateDurationLike = Pick<
  DurationLikeObject,
  'year' | 'years' | 'quarter' | 'quarters' | 'month' | 'months' | 'week' | 'weeks' | 'day' | 'days'
>

type CalendarDateDurationUnit = keyof Pick<
  DurationObjectUnits,
  'years' | 'quarters' | 'months' | 'weeks' | 'days'
>

type CalendarDateUnit = Extract<DateTimeUnit, 'year' | 'quarter' | 'month' | 'week' | 'day'>

export default class CalendarDate {
  private readonly luxonDateTime: DateTime

  constructor(source?: DateTime | number | null, month: number = 1, day: number = 1) {
    if (source instanceof DateTime && source.isValid) {
      const isoDate = source.toISODate()
      this.luxonDateTime = DateTime.fromISO(isoDate, { zone: 'UTC' })
    } else if (typeof source === 'number') {
      try {
        this.luxonDateTime = DateTime.utc(source, month, day)
      } catch (error) {
        if (error instanceof Error) throw new InvalidCalendarDate(error)
        throw error
      }
    } else {
      this.luxonDateTime = CalendarDate.today().toDateTime()
    }
  }

  public static fromDateTime(dateTime: DateTime): CalendarDate {
    return new CalendarDate(dateTime)
  }

  public static fromJSDate(javascriptDate: Date, { zone }: { zone?: string | Zone } = {}): CalendarDate {
    return new CalendarDate(DateTime.fromJSDate(javascriptDate, zone ? { zone } : undefined))
  }

  public static fromISO(str: string, { zone }: { zone?: string | Zone } = {}): CalendarDate {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromISO(str, zone ? { zone } : { setZone: true })
    } catch (error) {
      if (error instanceof Error) throw new InvalidCalendarDate(error)
      throw error
    }

    return new CalendarDate(dateTime)
  }

  public static fromSQL(str: string): CalendarDate {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromSQL(str, { zone: 'UTC' })
    } catch (error) {
      if (error instanceof Error) throw new InvalidCalendarDate(error)
      throw error
    }

    return new CalendarDate(dateTime)
  }

  public static fromObject(obj: DateObjectUnits, opts?: DateTimeJSOptions): CalendarDate {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromObject(obj, opts)
    } catch (error) {
      if (error instanceof Error) throw new InvalidCalendarDate(error)
      throw error
    }

    return new CalendarDate(dateTime)
  }

  public static today({ zone = 'UTC' }: { zone?: string | Zone } = {}): CalendarDate {
    return new CalendarDate(DateTime.now().setZone(zone))
  }

  public static tomorrow(options: { zone?: string | Zone } = {}): CalendarDate {
    return CalendarDate.today(options).plus({ day: 1 })
  }

  public static yesterday(options: { zone?: string | Zone } = {}): CalendarDate {
    return CalendarDate.today(options).minus({ day: 1 })
  }

  public toISO(): string {
    return this.luxonDateTime.toISODate()
  }

  public toSQL(): string {
    return this.luxonDateTime.toSQLDate()
  }

  public toJSON() {
    return this.toISO()
  }

  public valueOf(): number {
    return this.luxonDateTime.toMillis()
  }

  public toISODate() {
    return this.toISO()
  }

  public toLocaleString(formatOpts?: DateTimeFormatOptions, opts?: LocaleOptions): string {
    return this.luxonDateTime.toLocaleString(formatOpts, opts)
  }

  public toString() {
    return this.toISO()
  }

  public toDateTime(): DateTime {
    return this.luxonDateTime
  }

  public toJSDate(): Date {
    return this.luxonDateTime.toJSDate()
  }

  public get year(): number {
    return this.luxonDateTime.year
  }

  public get month(): number {
    return this.luxonDateTime.month
  }

  public get day(): number {
    return this.luxonDateTime.day
  }

  public startOf(period: CalendarDateUnit): CalendarDate {
    return new CalendarDate(this.luxonDateTime.startOf(period))
  }

  public endOf(period: CalendarDateUnit): CalendarDate {
    return new CalendarDate(this.luxonDateTime.endOf(period))
  }

  public plus(duration: CalendarDateDurationLike): CalendarDate {
    return new CalendarDate(this.luxonDateTime.plus(duration))
  }

  public minus(duration: CalendarDateDurationLike): CalendarDate {
    return new CalendarDate(this.luxonDateTime.minus(duration))
  }

  public static max(...calendarDates: Array<CalendarDate>): CalendarDate {
    const dateTimes = calendarDates.map(calendarDate => calendarDate.toDateTime())
    return new CalendarDate(DateTime.max(...dateTimes))
  }

  public static min(...calendarDates: Array<CalendarDate>): CalendarDate {
    const dateTimes = calendarDates.map(calendarDate => calendarDate.toDateTime())
    return new CalendarDate(DateTime.min(...dateTimes))
  }

  public hasSame(otherCalendarDate: CalendarDate, period: CalendarDateUnit): boolean {
    const otherDateTime = otherCalendarDate.toDateTime()
    if (otherDateTime === null) return false
    return this.luxonDateTime.hasSame(otherDateTime, period)
  }

  public diff(otherCalendarDate: CalendarDate, duration: CalendarDateDurationUnit): number {
    const otherDateTime = otherCalendarDate.toDateTime()
    return this.luxonDateTime.diff(otherDateTime, duration)[duration]
  }

  public diffNow(duration: CalendarDateDurationUnit): number {
    return Math.ceil(this.luxonDateTime.diffNow(duration)[duration])
  }

  public equals(otherCalendarDate: CalendarDate): boolean {
    return this.luxonDateTime.equals(otherCalendarDate.toDateTime())
  }
}

export class InvalidCalendarDate extends Error {
  constructor(error: Error) {
    super((error.message ?? '').replace('DateTime', 'CalendarDate'))
  }
}
