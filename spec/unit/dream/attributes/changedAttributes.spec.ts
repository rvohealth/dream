import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream#changedAttributes', () => {
  it(
    'Returns the attributes that have changed since being persisted to the database, with ' +
      'the values that were last persisted to the database.',
    async () => {
      const user = User.new({ email: 'ham@', password: 'howyadoin' })
      await user.save()

      user.email = 'fish'
      expect(user.changedAttributes()).toEqual({ email: 'ham@' })

      user.email = 'ham@'
      expect(user.changedAttributes()).toEqual({})
    }
  )

  it('lists every column on a record that has not been persisted, whether built with new or dup', () => {
    const user = User.new({ email: 'ham@', password: 'howyadoin' })
    const copy = user.dup()

    expect(Object.keys(user.changedAttributes()).sort()).toEqual([...User.columns()].sort())
    expect(Object.keys(copy.changedAttributes()).sort()).toEqual([...User.columns()].sort())
  })

  it('uses marshaled versions of database values for comparison', async () => {
    const user = await User.create({ email: 'ham@', password: 'howyadoin', birthdate: CalendarDate.today() })
    expect(user.changedAttributes()).toEqual({})

    user.birthdate = CalendarDate.yesterday()
    expect(user.changedAttributes()).toEqual({
      birthdate: expect.toEqualCalendarDate(CalendarDate.today()),
    })
  })
})
