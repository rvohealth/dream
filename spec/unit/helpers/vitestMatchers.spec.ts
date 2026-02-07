import { ClockTime, ClockTimeTz } from '../../../src/package-exports/index.js'
import CalendarDate from '../../../src/utils/datetime/CalendarDate.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import User from '../../../test-app/app/models/User.js'

describe('viMatchers', () => {
  describe('toMatchDreamModel', () => {
    let user: User
    let balloon: Balloon

    beforeEach(async () => {
      user = await User.create({ email: 'trace@was', password: 'here' })
      balloon = await Balloon.create({ type: 'Animal' })
    })

    it('can match with asymmetrical matchers', () => {
      const mock = vi.fn()
      mock(user)

      expect(mock).toHaveBeenCalledWith(expect.toMatchDreamModel(user))
      expect(mock).not.toHaveBeenCalledWith(expect.toMatchDreamModel(balloon))
    })

    it('can be used with toHaveBeenCalledWith multiple times', () => {
      const mock = vi.fn()
      mock(user, balloon)

      expect(mock).toHaveBeenCalledWith(expect.toMatchDreamModel(user), expect.toMatchDreamModel(balloon))
      expect(mock).not.toHaveBeenCalledWith(expect.toMatchDreamModel(balloon), expect.toMatchDreamModel(user))
    })

    it('can work with objects', () => {
      expect({ user }).toEqual(expect.objectContaining({ user: expect.toMatchDreamModel(user) }))
      expect({ user }).not.toEqual(expect.objectContaining({ user: expect.toMatchDreamModel(balloon) }))
      expect({ user, balloon }).toEqual(
        expect.objectContaining({
          user: expect.toMatchDreamModel(user),
          balloon: expect.toMatchDreamModel(balloon),
        })
      )
    })

    it('can work with arrays', () => {
      expect([user]).toEqual(expect.arrayContaining([expect.toMatchDreamModel(user)]))
      expect([user]).not.toEqual(expect.arrayContaining([expect.toMatchDreamModel(balloon)]))
      expect([user, balloon]).toEqual(
        expect.arrayContaining([expect.toMatchDreamModel(user), expect.toMatchDreamModel(balloon)])
      )
    })
  })

  describe('toEqualCalendarDate', () => {
    it('can match with asymmetrical matchers', () => {
      const mock = vi.fn()
      const calendarDate = CalendarDate.today()
      mock(calendarDate)

      expect(mock).toHaveBeenCalledWith(expect.toEqualCalendarDate(calendarDate))
    })

    it('can be used with toHaveBeenCalledWith multiple times', () => {
      const mock = vi.fn()
      const today = CalendarDate.today()
      const tomorrow = CalendarDate.tomorrow()
      mock(today, tomorrow)

      expect(mock).toHaveBeenCalledWith(
        expect.toEqualCalendarDate(today),
        expect.toEqualCalendarDate(tomorrow)
      )
      expect(mock).not.toHaveBeenCalledWith(
        expect.toEqualCalendarDate(tomorrow),
        expect.toEqualCalendarDate(today)
      )
    })

    it('can work with objects', () => {
      const today = CalendarDate.today()
      const tomorrow = CalendarDate.tomorrow()

      expect({ today }).toEqual(expect.objectContaining({ today: expect.toEqualCalendarDate(today) }))
      expect({ today }).not.toEqual(expect.objectContaining({ today: expect.toEqualCalendarDate(tomorrow) }))
      expect({ today, tomorrow }).toEqual(
        expect.objectContaining({
          today: expect.toEqualCalendarDate(today),
          tomorrow: expect.toEqualCalendarDate(tomorrow),
        })
      )
    })

    it('can work with arrays', () => {
      const today = CalendarDate.today()
      const tomorrow = CalendarDate.tomorrow()

      expect([today]).toEqual(expect.arrayContaining([expect.toEqualCalendarDate(today)]))
      expect([today]).not.toEqual(expect.arrayContaining([expect.toEqualCalendarDate(tomorrow)]))
      expect([today, tomorrow]).toEqual(
        expect.arrayContaining([expect.toEqualCalendarDate(today), expect.toEqualCalendarDate(tomorrow)])
      )
    })
  })

  describe('toEqualClockTime', () => {
    it('can match with asymmetrical matchers', () => {
      const mock = vi.fn()
      const clockTime = ClockTime.now()
      mock(clockTime)

      expect(mock).toHaveBeenCalledWith(expect.toEqualClockTime(clockTime))
    })

    it('can be used with toHaveBeenCalledWith multiple times', () => {
      const mock = vi.fn()
      const now = ClockTime.now()
      const nowPlusOneHour = now.plus({ hour: 1 })
      mock(now, nowPlusOneHour)

      expect(mock).toHaveBeenCalledWith(expect.toEqualClockTime(now), expect.toEqualClockTime(nowPlusOneHour))
      expect(mock).not.toHaveBeenCalledWith(
        expect.toEqualClockTime(nowPlusOneHour),
        expect.toEqualClockTime(now)
      )
    })

    it('can work with objects', () => {
      const now = ClockTime.now()
      const nowPlusOneHour = now.plus({ hour: 1 })

      expect({ now }).toEqual(expect.objectContaining({ now: expect.toEqualClockTime(now) }))
      expect({ now }).not.toEqual(expect.objectContaining({ now: expect.toEqualClockTime(nowPlusOneHour) }))
      expect({ now, nowPlusOneHour }).toEqual(
        expect.objectContaining({
          now: expect.toEqualClockTime(now),
          nowPlusOneHour: expect.toEqualClockTime(nowPlusOneHour),
        })
      )
    })

    it('can work with arrays', () => {
      const now = ClockTime.now()
      const nowPlusOneHour = now.plus({ hour: 1 })

      expect([now]).toEqual(expect.arrayContaining([expect.toEqualClockTime(now)]))
      expect([now]).not.toEqual(expect.arrayContaining([expect.toEqualClockTime(nowPlusOneHour)]))
      expect([now, nowPlusOneHour]).toEqual(
        expect.arrayContaining([expect.toEqualClockTime(now), expect.toEqualClockTime(nowPlusOneHour)])
      )
    })
  })

  describe('toEqualClockTimeTz', () => {
    it('can match with asymmetrical matchers', () => {
      const mock = vi.fn()
      const clockTime = ClockTimeTz.now()
      mock(clockTime)

      expect(mock).toHaveBeenCalledWith(expect.toEqualClockTimeTz(clockTime))
    })

    it('can be used with toHaveBeenCalledWith multiple times', () => {
      const mock = vi.fn()
      const now = ClockTimeTz.now()
      const nowPlusOneHour = now.plus({ hour: 1 })
      mock(now, nowPlusOneHour)

      expect(mock).toHaveBeenCalledWith(
        expect.toEqualClockTimeTz(now),
        expect.toEqualClockTimeTz(nowPlusOneHour)
      )
      expect(mock).not.toHaveBeenCalledWith(
        expect.toEqualClockTimeTz(nowPlusOneHour),
        expect.toEqualClockTimeTz(now)
      )
    })

    it('can work with objects', () => {
      const now = ClockTimeTz.now()
      const nowPlusOneHour = now.plus({ hour: 1 })

      expect({ now }).toEqual(expect.objectContaining({ now: expect.toEqualClockTimeTz(now) }))
      expect({ now }).not.toEqual(expect.objectContaining({ now: expect.toEqualClockTimeTz(nowPlusOneHour) }))
      expect({ now, nowPlusOneHour }).toEqual(
        expect.objectContaining({
          now: expect.toEqualClockTimeTz(now),
          nowPlusOneHour: expect.toEqualClockTimeTz(nowPlusOneHour),
        })
      )
    })

    it('can work with arrays', () => {
      const now = ClockTimeTz.now()
      const nowPlusOneHour = now.plus({ hour: 1 })

      expect([now]).toEqual(expect.arrayContaining([expect.toEqualClockTimeTz(now)]))
      expect([now]).not.toEqual(expect.arrayContaining([expect.toEqualClockTimeTz(nowPlusOneHour)]))
      expect([now, nowPlusOneHour]).toEqual(
        expect.arrayContaining([expect.toEqualClockTimeTz(now), expect.toEqualClockTimeTz(nowPlusOneHour)])
      )
    })
  })
})
