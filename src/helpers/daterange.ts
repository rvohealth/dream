import { DateTime } from 'luxon'

export default function daterange(
  begin: DateTime | null,
  end: DateTime | null = null,
  excludeEnd: boolean = false
) {
  return new DateRange(begin, end, excludeEnd)
}

export class DateRange {
  public begin: DateTime | null
  public end: DateTime | null
  public excludeEnd?: boolean
  constructor(begin: DateTime | null, end: DateTime | null = null, excludeEnd: boolean = false) {
    if (!begin && !end)
      throw `
        Must pass either begin or end to a date range
      `

    this.begin = begin
    this.end = end
    this.excludeEnd = excludeEnd
  }
}
