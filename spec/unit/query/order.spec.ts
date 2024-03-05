import User from '../../../test-app/app/models/User'

describe('Query#order', () => {
  it('orders by ascending direction when passed a single column', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.query().order('id').all()
    expect(records[0].id).toEqual(user1.id)
    expect(records[1].id).toEqual(user2.id)
  })

  context('associationQuery', () => {
    it('namespaces the column to avoid ambiguity', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const composition2 = await user2.createAssociation('compositions', { content: 'Hello' })
      const composition1 = await user1.createAssociation('compositions', { content: 'Goodbye' })

      const plucked = await user2.associationQuery('compositions').order('id').pluck('id', 'content')
      expect(plucked).toEqual([[composition2.id, 'Hello']])
    })
  })

  context('when passed null', () => {
    it('un-orders results', async () => {
      const user1 = await User.create({ email: 'b@bbbbbb', password: 'howyadoin' })
      const user2 = await User.create({ email: 'a@aaaaaa', password: 'howyadoin' })

      const records = await User.query().order('email').order(null).all()
      expect(records).toMatchDreamModels([user1, user2])
    })
  })

  it('when passed an object with a single column', async () => {
    const user1 = await User.create({ email: 'fred3@frewd', name: 'b', password: 'howyadoin' })
    const user2 = await User.create({ email: 'fred1@frewd', name: 'c', password: 'howyadoin' })
    const user3 = await User.create({ email: 'fred2@frewd', name: 'a', password: 'howyadoin' })

    const records = await User.query().order({ name: 'asc' }).all()
    expect(records[0].id).toEqual(user3.id)
    expect(records[1].id).toEqual(user1.id)
    expect(records[2].id).toEqual(user2.id)
  })

  it('when passed an object with multiple columns', async () => {
    const user1 = await User.create({ email: 'fred3@frewd', name: 'b', password: 'howyadoin' })
    const user2 = await User.create({ email: 'fred1@frewd', name: 'a', password: 'howyadoin' })
    const user3 = await User.create({ email: 'fred2@frewd', name: 'a', password: 'howyadoin' })

    const records = await User.query().order({ name: 'asc', email: 'desc' }).all()
    expect(records[0].id).toEqual(user3.id)
    expect(records[1].id).toEqual(user2.id)
    expect(records[2].id).toEqual(user1.id)
  })
})
