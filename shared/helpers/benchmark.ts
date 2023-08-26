import { DateTime } from 'luxon'

export type BenchmarkLogLevel = 'log' | 'warn' | 'error'

export default class Benchmark {
  private _start: DateTime
  private _startdate: Date
  public start() {
    this._start = DateTime.now()
    this._startdate = new Date()
  }

  public mark(message: string, level: BenchmarkLogLevel = 'log') {
    if (process.env.NODE_ENV === 'test' && process.env.ALLOW_BENCHMARKS !== '1') return
    if (!this._start) this.start()
    console[level](
      message,
      DateTime.now().diff(this._start, 'milliseconds').milliseconds,
      `(alternate benchmark: ${new Date().getMilliseconds() - this._startdate.getMilliseconds()})`
    )
  }
}
