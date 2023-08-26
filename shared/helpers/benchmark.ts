import { DateTime } from 'luxon'

export type BenchmarkLogLevel = 'log' | 'warn' | 'error'

let start: DateTime | null = null
export default function benchmark(
  message: string,
  {
    reset = false,
    level = 'log',
  }: {
    reset?: boolean
    level?: BenchmarkLogLevel
  } = {}
) {
  if (process.env.NODE_ENV === 'test') return
  if (!start || reset) start = DateTime.now()
  console[level](message, DateTime.now().diff(start).milliseconds)
}
