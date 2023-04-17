export default function range<T>(begin: T | null, end: T | null = null, excludeEnd: boolean = false) {
  return new Range<T>(begin, end, excludeEnd)
}

export class Range<T> {
  public begin: T | null
  public end: T | null
  public excludeEnd?: boolean
  constructor(begin: T | null, end: T | null = null, excludeEnd: boolean = false) {
    if (!begin && !end)
      throw `
        Must pass either begin or end to a date range
      `

    this.begin = begin
    this.end = end
    this.excludeEnd = excludeEnd
  }
}
