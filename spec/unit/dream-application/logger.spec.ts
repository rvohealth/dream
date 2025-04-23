import { MockInstance } from 'vitest'
import { CalendarDate, DateTime, DreamApplication } from '../../../src/index.js'

describe('log functions', () => {
  let logSpy: MockInstance
  let warnSpy: MockInstance

  beforeEach(() => {
    logSpy = vi.spyOn(DreamApplication.getOrFail()['logger'] as any, 'info')
    warnSpy = vi.spyOn(DreamApplication.getOrFail()['logger'] as any, 'warn')
  })

  describe('log', () => {
    it('works with a string', () => {
      DreamApplication.log('hello world')
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    })

    it('works with strings', () => {
      DreamApplication.log('hello', 'world')
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    })

    it('works with null', () => {
      DreamApplication.log(null)
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('null'))
    })

    it('works with undefined', () => {
      DreamApplication.log(undefined)
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('undefined'))
    })

    it('works with a number', () => {
      DreamApplication.log(7)
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('7'))
    })

    it('doesn’t throw an error with an object', () => {
      DreamApplication.log({ hello: 'world' })
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[object Object]'))
    })

    it('works with a DateTime', () => {
      const now = DateTime.now()
      DreamApplication.log(now)
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(now.toISO()))
    })

    it('works with a CalendarDate', () => {
      const today = CalendarDate.today()
      DreamApplication.log(today)
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(today.toISO()!))
    })

    it('works with an Error', () => {
      DreamApplication.log(new Error('with an error'))
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('with an error'))
    })

    it('works with an Error followed by a string', () => {
      DreamApplication.log(new Error('Error followed by a string'), 'string following the error')
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Error followed by a string'))
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('string following the error'))
    })
  })

  describe('logWithLevel', () => {
    it('works with a string', () => {
      DreamApplication.logWithLevel('warn', 'hello world')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    })

    it('works with strings', () => {
      DreamApplication.logWithLevel('warn', 'hello', 'world')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    })

    it('works with null', () => {
      DreamApplication.logWithLevel('warn', null)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('null'))
    })

    it('works with undefined', () => {
      DreamApplication.logWithLevel('warn', undefined)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('undefined'))
    })

    it('works with a number', () => {
      DreamApplication.logWithLevel('warn', 7)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('7'))
    })

    it('doesn’t throw an error with an object', () => {
      DreamApplication.logWithLevel('warn', { hello: 'world' })
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[object Object]'))
    })

    it('works with a DateTime', () => {
      const now = DateTime.now()
      DreamApplication.logWithLevel('warn', now)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(now.toISO()))
    })

    it('works with a CalendarDate', () => {
      const today = CalendarDate.today()
      DreamApplication.logWithLevel('warn', today)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(today.toISO()!))
    })

    it('works with an Error', () => {
      DreamApplication.logWithLevel('warn', new Error('with an error'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('with an error'))
    })

    it('works with an Error followed by a string', () => {
      DreamApplication.logWithLevel(
        'warn',
        new Error('Error followed by a string'),
        'string following the error'
      )
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Error followed by a string'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('string following the error'))
    })
  })
})
