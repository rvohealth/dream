import User from '../../../test-app/app/models/User'

describe('Query#whereAny', () => {
  context('within where-object', () => {
    it('treats keys within the object as AND statements', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'aster@brown', password: 'howyadoin' })
      const user3 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.query()
        .whereAny([{ email: 'fred@frewd', id: user2.id }])
        .all()
      expect(records).toEqual([])
    })
  })

  context('chained', () => {
    it('combines the separate OR statements using AND', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'aster@brown', password: 'howyadoin' })
      const user3 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.query()
        .whereAny([{ email: 'fred@frewd' }, { email: 'aster@brown' }])
        .whereAny([{ email: 'how@yadoin' }, { email: 'aster@brown' }])
        .all()
      expect(records).toMatchDreamModels([user2])
    })
  })

  context('between where-objects', () => {
    it('treats the separate object as OR statements', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'aster@brown', password: 'howyadoin' })
      const user3 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.query()
        .whereAny([{ email: 'fred@frewd' }, { id: user2.id }])
        .all()
      expect(records).toMatchDreamModels([user1, user2])
    })

    it('the same key can be specified in multiple clauses', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'aster@brown', password: 'howyadoin' })
      const user3 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.query()
        .whereAny([{ id: user1.id }, { id: user2.id }])
        .all()
      expect(records).toMatchDreamModels([user1, user2])
    })
  })

  context('where IN', () => {
    it('work', async () => {
      const user1a = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user1b = await User.create({ email: 'fred2@frewd', password: 'howyadoin' })
      const user2a = await User.create({ email: 'aster@brown', password: 'howyadoin' })
      const user2b = await User.create({ email: 'aster2@brown', password: 'howyadoin' })
      const user3 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const records = await User.query()
        .whereAny([{ id: [user1a.id, user1b.id] }, { id: [user2a.id, user2b.id] }])
        .all()
      expect(records).toMatchDreamModels([user1a, user1b, user2a, user2b])
    })
  })

  context('nested selects', () => {
    it('work', async () => {
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

      const records = await User.whereAny([
        {
          id: User.where({ id: user1.id }).nestedSelect('id'),
        },
        {
          id: User.where({ id: user2.id }).nestedSelect('id'),
        },
      ]).all()
      expect(records).toMatchDreamModels([user1, user2])
    })
  })
})
