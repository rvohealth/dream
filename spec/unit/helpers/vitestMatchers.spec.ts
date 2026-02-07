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
})
