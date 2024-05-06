import {
  DateObjectUnits,
  DateTime,
  DateTimeFormatOptions,
  DateTimeJSOptions,
  DurationLikeObject,
  DurationObjectUnits,
  LocaleOptions,
  Zone,
} from 'luxon'

type CalendarDateDurationLike = Pick<
  DurationLikeObject,
  'year' | 'years' | 'quarter' | 'quarters' | 'month' | 'months' | 'week' | 'weeks' | 'day' | 'days'
>

type CalendarDateDurationUnit = keyof Pick<
  DurationObjectUnits,
  'years' | 'quarters' | 'months' | 'weeks' | 'days'
>

export default class CalendarDate {
  private luxonDateTime: DateTime | null

  constructor(source: DateTime | number | null, month: number = 1, day: number = 1) {
    if (source instanceof DateTime && source.isValid) {
      const isoDate = source.toISODate()!
      this.luxonDateTime = DateTime.fromISO(isoDate, { zone: 'UTC' })
    } else if (typeof source === 'number') {
      const dateTime = DateTime.utc(source, month, day)
      this.luxonDateTime = dateTime.isValid ? dateTime : null
    } else {
      this.luxonDateTime = null
    }
  }

  public static fromDateTime(dateTime: DateTime): CalendarDate {
    return new CalendarDate(dateTime)
  }

  public static fromJSDate(javascriptDate: Date, { zone }: { zone?: string | Zone } = {}): CalendarDate {
    return new CalendarDate(DateTime.fromJSDate(javascriptDate, { zone }))
  }

  public static newInvalidDate(): CalendarDate {
    return new CalendarDate(null)
  }

  public static fromISO(str: string, { zone }: { zone?: string | Zone } = {}): CalendarDate {
    if (zone) return new CalendarDate(DateTime.fromISO(str, { zone }))
    else return new CalendarDate(DateTime.fromISO(str, { setZone: true }))
  }

  public static fromObject(obj: DateObjectUnits, opts?: DateTimeJSOptions): CalendarDate {
    return new CalendarDate(DateTime.fromObject(obj, opts))
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

  public get isValid(): boolean {
    if (this.luxonDateTime === null) return false
    return this.luxonDateTime.isValid
  }

  public toISO(): string | null {
    if (this.luxonDateTime === null) return null
    return this.luxonDateTime.toISODate()
  }

  public toJSON() {
    return this.toISO()
  }

  public valueOf() {
    return this.toISO()
  }

  public toISODate() {
    return this.toISO()
  }

  public toLocaleString(formatOpts?: DateTimeFormatOptions, opts?: LocaleOptions): string | null {
    if (this.luxonDateTime === null) return null
    return this.luxonDateTime.toLocaleString(formatOpts, opts)
  }

  public toString() {
    return this.toISO()
  }

  public toDateTime(): DateTime | null {
    return this.luxonDateTime
  }

  public toJSDate(): Date | null {
    if (this.luxonDateTime === null) return null
    return this.luxonDateTime.toJSDate()
  }

  public get year(): number | null {
    if (this.luxonDateTime === null) return null
    return this.luxonDateTime.year
  }

  public get month(): number | null {
    if (this.luxonDateTime === null) return null
    return this.luxonDateTime.month
  }

  public get day(): number | null {
    if (this.luxonDateTime === null) return null
    return this.luxonDateTime.day
  }

  public plus(duration: CalendarDateDurationLike): CalendarDate {
    if (this.luxonDateTime === null) return CalendarDate.newInvalidDate()
    return new CalendarDate(this.luxonDateTime.plus(duration))
  }

  public minus(duration: CalendarDateDurationLike): CalendarDate {
    if (this.luxonDateTime === null) return CalendarDate.newInvalidDate()
    return new CalendarDate(this.luxonDateTime.minus(duration))
  }

  public static max(calendarDate: CalendarDate, otherCalendarDate: CalendarDate): CalendarDate {
    const dateTime = calendarDate.toDateTime()
    if (dateTime === null) return CalendarDate.newInvalidDate()
    const otherDateTime = otherCalendarDate.toDateTime()
    if (otherDateTime === null) return CalendarDate.newInvalidDate()
    return new CalendarDate(DateTime.max(dateTime, otherDateTime))
  }

  public static min(calendarDate: CalendarDate, otherCalendarDate: CalendarDate): CalendarDate {
    const dateTime = calendarDate.toDateTime()
    if (dateTime === null) return CalendarDate.newInvalidDate()
    const otherDateTime = otherCalendarDate.toDateTime()
    if (otherDateTime === null) return CalendarDate.newInvalidDate()
    return new CalendarDate(DateTime.min(dateTime, otherDateTime))
  }

  public diff(otherCalendarDate: CalendarDate, duration: CalendarDateDurationUnit): number | null {
    if (this.luxonDateTime === null) return null
    const otherDateTime = otherCalendarDate.toDateTime()
    if (otherDateTime === null) return null
    return this.luxonDateTime.diff(otherDateTime, duration)[duration]
  }

  public diffNow(duration: CalendarDateDurationUnit): number | null {
    if (this.luxonDateTime === null) return null
    return Math.ceil(this.luxonDateTime.diffNow(duration)[duration])
  }

  public equals(otherCalendarDate: CalendarDate): boolean {
    if (this.luxonDateTime === null) return otherCalendarDate.toDateTime() === null
    const otherDateTime = otherCalendarDate.toDateTime()
    if (otherDateTime === null) return this.luxonDateTime === null
    return this.luxonDateTime.equals(otherDateTime)
  }
}
