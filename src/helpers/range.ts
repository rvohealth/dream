export default function range<T>(begin: T | null, end: T | null = null, excludeEnd: boolean = false) {
  return new Range<T>(begin, end, excludeEnd)
}

export class Range<T> {
  constructor(
    public readonly begin: T | null,
    public readonly end: T | null = null,
    public readonly excludeEnd: boolean = false
  ) {
    if (!begin && !end) throw new Error('Must pass either begin or end to a date range')
  }
}
