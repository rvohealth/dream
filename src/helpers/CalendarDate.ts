import { DateObjectUnits, DateTimeJSOptions, DateTimeUnit, LocaleOptions } from '../types/luxon/datetime.js'
import { DurationLikeObject, DurationObjectUnits } from '../types/luxon/duration.js'
import { DateTimeFormatOptions } from '../types/luxon/misc.js'
import { Zone } from '../types/luxon/zone.js'
import compact from './compact.js'
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
type Valid = true
type Invalid = false

export default class CalendarDate<IsValid extends boolean = boolean> {
  private readonly luxonDateTime: DateTime | null

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

  public static fromDateTime<
    T extends DateTime<Valid> | DateTime<Invalid> | DateTime<boolean>,
    GenericType extends T extends DateTime<Valid> ? Valid : T extends DateTime<Invalid> ? Invalid : boolean,
  >(dateTime: T): CalendarDate<GenericType> {
    return new CalendarDate<GenericType>(dateTime)
  }

  public static fromJSDate(
    javascriptDate: Date,
    { zone }: { zone?: string | Zone } = {}
  ): CalendarDate<Valid> {
    return new CalendarDate<Valid>(DateTime.fromJSDate(javascriptDate, zone ? { zone } : undefined))
  }

  public static newInvalidDate(): CalendarDate<Invalid> {
    return new CalendarDate<Invalid>(null)
  }

  public static fromISO(
    str: string,
    { zone }: { zone?: string | Zone } = {}
  ): CalendarDate<Valid> | CalendarDate<Invalid> {
    if (zone) return new CalendarDate(DateTime.fromISO(str, { zone }))
    else return new CalendarDate(DateTime.fromISO(str, { setZone: true }))
  }

  public static fromSQL(str: string): CalendarDate<Valid> {
    return new CalendarDate<Valid>(DateTime.fromSQL(str, { zone: 'UTC' }))
  }

  public static fromObject(
    obj: DateObjectUnits,
    opts?: DateTimeJSOptions
  ): CalendarDate<Valid> | CalendarDate<Invalid> {
    return new CalendarDate(DateTime.fromObject(obj, opts))
  }

  public static today({ zone = 'UTC' }: { zone?: string | Zone } = {}): CalendarDate<Valid> {
    return new CalendarDate<Valid>(DateTime.now().setZone(zone))
  }

  public static tomorrow(options: { zone?: string | Zone } = {}): CalendarDate<Valid> {
    return CalendarDate.today(options).plus({ day: 1 })
  }

  public static yesterday(options: { zone?: string | Zone } = {}): CalendarDate<Valid> {
    return CalendarDate.today(options).minus({ day: 1 })
  }

  public get isValid(): boolean {
    if (this.luxonDateTime === null) return false
    return this.luxonDateTime.isValid
  }

  public toISO(): IsValid extends Valid ? string : string | null {
    if (this.luxonDateTime === null) return null as IsValid extends Valid ? string : string | null
    return this.luxonDateTime.toISODate() as IsValid extends Valid ? string : string | null
  }

  public toSQL(): IsValid extends Valid ? string : string | null {
    if (this.luxonDateTime === null) return null as IsValid extends Valid ? string : string | null
    return this.luxonDateTime.toSQLDate() as IsValid extends Valid ? string : string | null
  }

  public toJSON() {
    return this.toISO()
  }

  public valueOf(): number {
    if (this.luxonDateTime === null) return -1
    return this.luxonDateTime.toMillis()
  }

  public toISODate() {
    return this.toISO()
  }

  public toLocaleString(
    formatOpts?: DateTimeFormatOptions,
    opts?: LocaleOptions
  ): IsValid extends Valid ? string : string | null {
    if (this.luxonDateTime === null) return null as IsValid extends Valid ? string : string | null
    return this.luxonDateTime.toLocaleString(formatOpts, opts) as IsValid extends Valid
      ? string
      : string | null
  }

  public toString() {
    return this.toISO()
  }

  public toDateTime(): IsValid extends Valid
    ? DateTime<Valid>
    : IsValid extends Invalid
      ? null
      : DateTime | null {
    return this.luxonDateTime as IsValid extends Valid
      ? DateTime<Valid>
      : IsValid extends Invalid
        ? null
        : DateTime | null
  }

  public toJSDate(): IsValid extends Valid ? Date : Date | null {
    if (this.luxonDateTime === null) return null as IsValid extends Valid ? Date : Date | null
    return this.luxonDateTime.toJSDate() as IsValid extends Valid ? Date : Date | null
  }

  public get year(): IsValid extends Valid ? number : number | null {
    if (this.luxonDateTime === null) return null as IsValid extends Valid ? number : number | null
    return this.luxonDateTime.year as IsValid extends Valid ? number : number | null
  }

  public get month(): IsValid extends Valid ? number : number | null {
    if (this.luxonDateTime === null) return null as IsValid extends Valid ? number : number | null
    return this.luxonDateTime.month as IsValid extends Valid ? number : number | null
  }

  public get day(): IsValid extends Valid ? number : number | null {
    if (this.luxonDateTime === null) return null as IsValid extends Valid ? number : number | null
    return this.luxonDateTime.day as IsValid extends Valid ? number : number | null
  }

  public startOf(period: CalendarDateUnit): CalendarDate<IsValid> {
    if (this.luxonDateTime === null) return CalendarDate.newInvalidDate() as CalendarDate<IsValid>
    return new CalendarDate(this.luxonDateTime.startOf(period))
  }

  public endOf(period: CalendarDateUnit): CalendarDate<IsValid> {
    if (this.luxonDateTime === null) return CalendarDate.newInvalidDate() as CalendarDate<IsValid>
    return new CalendarDate(this.luxonDateTime.endOf(period))
  }

  public plus(duration: CalendarDateDurationLike): CalendarDate<IsValid> {
    if (this.luxonDateTime === null) return CalendarDate.newInvalidDate() as CalendarDate<IsValid>
    return new CalendarDate(this.luxonDateTime.plus(duration))
  }

  public minus(duration: CalendarDateDurationLike): CalendarDate<IsValid> {
    if (this.luxonDateTime === null) return CalendarDate.newInvalidDate() as CalendarDate<IsValid>
    return new CalendarDate(this.luxonDateTime.minus(duration))
  }

  public static max<AllValid extends boolean>(
    ...calendarDates: Array<CalendarDate<AllValid>>
  ):
    | (AllValid extends true ? CalendarDate<Valid> : never)
    | (AllValid extends false ? CalendarDate<Invalid> : never) {
    const dateTimes = compact(calendarDates.map(calendarDate => calendarDate.toDateTime()))

    return new CalendarDate(DateTime.max(...dateTimes)) as
      | (AllValid extends true ? CalendarDate<Valid> : never)
      | (AllValid extends false ? CalendarDate<Invalid> : never)
  }

  public static min<AllValid extends boolean>(
    ...calendarDates: Array<CalendarDate<AllValid>>
  ):
    | (AllValid extends true ? CalendarDate<Valid> : never)
    | (AllValid extends false ? CalendarDate<Invalid> : never) {
    const dateTimes = compact(calendarDates.map(calendarDate => calendarDate.toDateTime()))

    return new CalendarDate(DateTime.min(...dateTimes)) as
      | (AllValid extends true ? CalendarDate<Valid> : never)
      | (AllValid extends false ? CalendarDate<Invalid> : never)
  }

  public hasSame(
    otherCalendarDate: CalendarDate<Valid> | CalendarDate<Invalid>,
    period: CalendarDateUnit
  ): boolean {
    if (this.luxonDateTime === null) return false
    const otherDateTime = (otherCalendarDate as CalendarDate).toDateTime()
    if (otherDateTime === null) return false
    return this.luxonDateTime.hasSame(otherDateTime, period)
  }

  public diff<T extends CalendarDate<Valid> | CalendarDate<Invalid>>(
    otherCalendarDate: T,
    duration: CalendarDateDurationUnit
  ): IsValid extends Valid ? (T extends CalendarDate<Valid> ? number : number | null) : number | null {
    if (this.luxonDateTime === null) return null as any
    const otherDateTime = (otherCalendarDate as CalendarDate).toDateTime()
    if (otherDateTime === null) return null as any
    return this.luxonDateTime.diff(otherDateTime, duration)[duration] as any
  }

  public diffNow(duration: CalendarDateDurationUnit): IsValid extends Valid ? number : number | null {
    if (this.luxonDateTime === null) return null as IsValid extends Valid ? number : number | null
    return Math.ceil(this.luxonDateTime.diffNow(duration)[duration]) as IsValid extends Valid
      ? number
      : number | null
  }

  public equals(otherCalendarDate: CalendarDate): boolean {
    if (this.luxonDateTime === null) return otherCalendarDate.toDateTime() === null
    const otherDateTime = otherCalendarDate.toDateTime()
    if (otherDateTime === null) return this.luxonDateTime === null
    return this.luxonDateTime.equals(otherDateTime)
  }
}
