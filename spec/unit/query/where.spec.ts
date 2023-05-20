import { DateTime } from 'luxon'
import User from '../../../test-app/app/models/User'
import range from '../../../src/helpers/range'
import ops from '../../../src/ops'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Balloon from '../../../test-app/app/models/Balloon'

describe('Query#where', () => {
  context('a generic expression is passed', () => {
    it('uses an "in" operator for comparison', async () => {
      const user1 = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
      })
      const user2 = await User.create({
        email: 'frez@frewd',
        password: 'howyadoin',
      })
      const user3 = await User.create({
        email: 'frez@fishman',
        password: 'howyadoin',
      })

      const records = await User.where({ id: ops.expression('in', [user1.id, user2.id]) }).pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })
  })

  context('ops.in is passed', () => {
    it('uses an "in" operator for comparison', async () => {
      const user1 = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
      })
      const user2 = await User.create({
        email: 'frez@frewd',
        password: 'howyadoin',
      })
      const user3 = await User.create({
        email: 'frez@fishman',
        password: 'howyadoin',
      })

      const records = await User.where({ id: ops.in([user1.id, user2.id]) }).pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })
  })

  context('ops.any is passed', () => {
    it('uses an "@>" operator for comparison', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const multicolorBalloon = await Mylar.create({
        user,
        multicolor: ['red', 'green'],
      })

      const greenBalloon = await Mylar.create({
        user,
        multicolor: ['green'],
      })

      const blueBalloon = await Mylar.create({
        user,
        multicolor: ['blue'],
      })

      const balloons = await Balloon.where({ multicolor: ops.any('green') }).all()
      expect(balloons).toMatchDreamModels([multicolorBalloon, greenBalloon])
    })
  })

  context('an array is passed', () => {
    it('uses an "in" operator for comparison', async () => {
      const user1 = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
      })
      const user2 = await User.create({
        email: 'frez@frewd',
        password: 'howyadoin',
      })
      await User.create({
        email: 'frez@fishman',
        password: 'howyadoin',
      })

      const records = await User.where({ id: [user1.id, user2.id] }).pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })
  })

  context('ops.like statement is passed', () => {
    it('uses an "in" operator for comparison', async () => {
      const user1 = await User.create({
        email: 'aaa@aaa',
        password: 'howyadoin',
      })
      const user2 = await User.create({
        email: 'Aaa@zzz',
        password: 'howyadoin',
      })
      const user3 = await User.create({
        email: 'zzz@zzz',
        password: 'howyadoin',
      })

      const records = await User.where({ email: ops.like('%aaa@%') }).pluck('id')
      expect(records).toEqual([user1.id])
    })
  })

  context('ops.ilike statement is passed', () => {
    it('uses an "ilike" operator for comparison', async () => {
      const user1 = await User.create({
        email: 'aaa@aaa',
        password: 'howyadoin',
      })
      const user2 = await User.create({
        email: 'Aaa@zzz',
        password: 'howyadoin',
      })
      const user3 = await User.create({
        email: 'zzz@zzz',
        password: 'howyadoin',
      })

      const records = await User.where({ email: ops.ilike('%aaa@%') }).pluck('id')
      expect(records).toEqual([user1.id, user2.id])
    })
  })

  context('a date range is passed', () => {
    const begin = DateTime.now()
    const end = DateTime.now().plus({ day: 1 })

    let user0: User
    let user1: User
    let user2: User
    let user3: User
    let user4: User
    beforeEach(async () => {
      user0 = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        created_at: begin.minus({ hour: 1 }),
      })
      user1 = await User.create({
        email: 'fred@frezd',
        password: 'howyadoin',
        created_at: begin,
      })
      user2 = await User.create({
        email: 'fred@frwwd',
        password: 'howyadoin',
        created_at: begin.plus({ hour: 1 }),
      })
      user3 = await User.create({
        email: 'fred@frewdzsd',
        password: 'howyadoin',
        created_at: end,
      })
      user4 = await User.create({
        email: 'fred@frwewdzsd',
        password: 'howyadoin',
        created_at: end.plus({ hour: 1 }),
      })
    })

    it('is able to apply date ranges to where clause', async () => {
      const records = await User.order('id')
        .where({ created_at: range(begin, end) })
        .all()

      expect(records.length).toEqual(3)
      expect(records.map(r => r.id)).toEqual([user1.id, user2.id, user3.id])
    })

    context('end is not passed', () => {
      it('finds all dates after the start', async () => {
        const records = await User.order('id')
          .where({ created_at: range(begin.plus({ hour: 1 })) })
          .all()

        expect(records.length).toEqual(3)
        expect(records.map(r => r.id)).toEqual([user2.id, user3.id, user4.id])
      })
    })

    context('start is not passed', () => {
      it('finds all dates after the start', async () => {
        const records = await User.order('id')
          .where({ created_at: range(null, begin.plus({ hour: 1 })) })
          .all()

        expect(records.length).toEqual(3)
        expect(records.map(r => r.id)).toEqual([user0.id, user1.id, user2.id])
      })
    })

    context('excludeEnd is passed', () => {
      it('omits a record landing exactly on the end date', async () => {
        const records = await User.order('id')
          .where({ created_at: range(begin, end, true) })
          .all()

        expect(records.length).toEqual(2)
        expect(records.map(r => r.id)).toEqual([user1.id, user2.id])
      })
    })
  })
})
