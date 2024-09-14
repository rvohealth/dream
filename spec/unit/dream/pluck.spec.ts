import { CalendarDate } from '../../../src'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import User from '../../../test-app/app/models/User'

describe('Dream#pluck', () => {
  let user1: User
  let user2: User

  beforeEach(async () => {
    user1 = await User.create({
      email: 'fred@frewd',
      password: 'howyadoin',
      birthdate: CalendarDate.fromISO('1987-07-22'),
    })
    user2 = await User.create({
      email: 'how@yadoin',
      password: 'howyadoin',
      birthdate: CalendarDate.fromISO('1993-11-03'),
    })
  })

  it('plucks the specified attributes and returns them as raw data', async () => {
    const records = await User.pluck('id')
    expect(records).toEqual([user1.id, user2.id])
  })

  it('marshals to the proper type', async () => {
    const records = await User.order({ birthdate: 'desc' }).pluck('birthdate')
    expect(records[0]).toEqualCalendarDate(CalendarDate.fromISO('1993-11-03'))
    expect(records[1]).toEqualCalendarDate(CalendarDate.fromISO('1987-07-22'))
  })

  context('when encased in a transaction', () => {
    it('plucks the specified attributes and returns them as raw data', async () => {
      let user3: User | null = null
      let records: any[] = []
      await ApplicationModel.transaction(async txn => {
        user3 = await User.txn(txn).create({ email: 'fred@txn', password: 'howyadoin' })
        records = await User.txn(txn).pluck('id')
      })
      expect(records).toEqual([user1.id, user2.id, user3!.id])
    })
  })

  context('with multiple fields', () => {
    it('should return multi-dimensional array', async () => {
      const records = await User.order('id').pluck('id', 'createdAt')
      expect(records).toEqual([
        [user1.id, user1.createdAt],
        [user2.id, user2.createdAt],
      ])
    })
  })
})
