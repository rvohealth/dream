import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'
import ops from '../../../src/ops'

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
      await user1.createAssociation('compositions', { content: 'Goodbye' })

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

  context('when one of the records has a null value', () => {
    it('prioritizes null values last', async () => {
      const user1 = await User.create({ email: 'c@cccccc', targetRating: 4, password: 'howyadoin' })
      const user2 = await User.create({ email: 'b@bbbbbb', targetRating: 5, password: 'howyadoin' })
      const user3 = await User.create({ email: 'a@aaaaaa', targetRating: null, password: 'howyadoin' })

      const records = await User.query().order({ targetRating: 'desc' }).all()
      expect(records.length).toEqual(3)
      expect(records[0]).toMatchDreamModel(user2)
      expect(records[1]).toMatchDreamModel(user1)
      expect(records[2]).toMatchDreamModel(user3)
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

  context('with similarity match', () => {
    it('orders first by similarity match, then by explicit order', async () => {
      const pet1 = await Pet.create({ name: 'Chia' })
      const pet2 = await Pet.create({ name: 'Chai' })
      const pet3 = await Pet.create({ name: 'Chia' })

      const pets = await Pet.where({ name: ops.wordSimilarity('Chia', { score: 0.4 }) })
        .order({ id: 'desc' })
        .all()
      expect(pets).toHaveLength(3)
      expect(pets[0]).toMatchDreamModel(pet3)
      expect(pets[1]).toMatchDreamModel(pet1)
      expect(pets[2]).toMatchDreamModel(pet2)
    })

    context('when one of the records has a null value', () => {
      it('prioritizes null values last', async () => {
        const user1 = await User.create({
          email: 'a@aaaaaa',
          password: 'howyadoin',
          name: 'Chia',
          targetRating: 2,
        })
        const user2 = await User.create({
          email: 'b@bbbbb',
          password: 'howyadoin',
          name: 'Chia',
          targetRating: null,
        })
        const user3 = await User.create({
          email: 'c@ccccc',
          password: 'howyadoin',
          name: 'Chia',
          targetRating: 1,
        })

        const users = await User.where({ name: ops.wordSimilarity('Chia', { score: 0.4 }) })
          .order({ targetRating: 'desc' })
          .all()

        expect(users).toHaveLength(3)
        expect(users[0]).toMatchDreamModel(user1)
        expect(users[1]).toMatchDreamModel(user3)
        expect(users[2]).toMatchDreamModel(user2)
      })
    })

    context('plucking', () => {
      it('orders first by similarity match, then by explicit order', async () => {
        const pet1 = await Pet.create({ name: 'Chia' })
        const pet2 = await Pet.create({ name: 'Chai' })
        const pet3 = await Pet.create({ name: 'Chia' })

        const petIds = await Pet.where({ name: ops.wordSimilarity('Chia', { score: 0.4 }) })
          .order({ id: 'desc' })
          .pluck('id')
        expect(petIds).toEqual([pet3.id, pet1.id, pet2.id])
      })
    })
  })
})
