import { DateTime } from 'luxon'
import EnvInternal from './EnvInternal.js.js'

export type BenchmarkLogLevel = 'log' | 'warn' | 'error'

export default class Benchmark {
  private _start: DateTime
  public start() {
    this._start = DateTime.now()
  }

  public mark(message: string, level: BenchmarkLogLevel = 'log') {
    if (EnvInternal.isTest && !EnvInternal.boolean('ALLOW_BENCHMARKS')) return
    if (!this._start) this.start()
    console[level](message, DateTime.now().diff(this._start, 'milliseconds').milliseconds)
  }
}
