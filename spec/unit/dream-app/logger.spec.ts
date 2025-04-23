import { MockInstance } from 'vitest'
import { CalendarDate, DateTime, DreamApp } from '../../../src/index.js'

describe('log functions', () => {
  let logSpy: MockInstance
  let warnSpy: MockInstance

  beforeEach(() => {
    logSpy = vi.spyOn(DreamApp.getOrFail()['logger'] as any, 'info')
    warnSpy = vi.spyOn(DreamApp.getOrFail()['logger'] as any, 'warn')
  })

  describe('log', () => {
    it('works with a string', () => {
      DreamApp.log('hello world')
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    })

    it('works with strings', () => {
      DreamApp.log('hello', 'world')
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    })

    it('works with null', () => {
      DreamApp.log(null)
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('null'))
    })

    it('works with undefined', () => {
      DreamApp.log(undefined)
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('undefined'))
    })

    it('works with a number', () => {
      DreamApp.log(7)
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('7'))
    })

    it('doesn’t throw an error with an object', () => {
      DreamApp.log({ hello: 'world' })
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[object Object]'))
    })

    it('works with a DateTime', () => {
      const now = DateTime.now()
      DreamApp.log(now)
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(now.toISO()))
    })

    it('works with a CalendarDate', () => {
      const today = CalendarDate.today()
      DreamApp.log(today)
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(today.toISO()!))
    })

    it('works with an Error', () => {
      DreamApp.log(new Error('with an error'))
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('with an error'))
    })

    it('works with an Error followed by a string', () => {
      DreamApp.log(new Error('Error followed by a string'), 'string following the error')
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Error followed by a string'))
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('string following the error'))
    })
  })

  describe('logWithLevel', () => {
    it('works with a string', () => {
      DreamApp.logWithLevel('warn', 'hello world')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    })

    it('works with strings', () => {
      DreamApp.logWithLevel('warn', 'hello', 'world')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    })

    it('works with null', () => {
      DreamApp.logWithLevel('warn', null)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('null'))
    })

    it('works with undefined', () => {
      DreamApp.logWithLevel('warn', undefined)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('undefined'))
    })

    it('works with a number', () => {
      DreamApp.logWithLevel('warn', 7)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('7'))
    })

    it('doesn’t throw an error with an object', () => {
      DreamApp.logWithLevel('warn', { hello: 'world' })
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[object Object]'))
    })

    it('works with a DateTime', () => {
      const now = DateTime.now()
      DreamApp.logWithLevel('warn', now)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(now.toISO()))
    })

    it('works with a CalendarDate', () => {
      const today = CalendarDate.today()
      DreamApp.logWithLevel('warn', today)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(today.toISO()!))
    })

    it('works with an Error', () => {
      DreamApp.logWithLevel('warn', new Error('with an error'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('with an error'))
    })

    it('works with an Error followed by a string', () => {
      DreamApp.logWithLevel('warn', new Error('Error followed by a string'), 'string following the error')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Error followed by a string'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('string following the error'))
    })
  })
})
