import Mylar from '../../../../../test-app/app/models/Balloon/Mylar.js'
import Collar from '../../../../../test-app/app/models/Collar.js'
import Pet from '../../../../../test-app/app/models/Pet.js'
import User from '../../../../../test-app/app/models/User.js'

describe('Query#leftJoin through with simple associations and overriding primary key', () => {
  context('explicit HasMany through', () => {
    it('sets HasMany property on the model and BelongsToProperty on the associated model, including models that don’t have an associated model', async () => {
      const user1 = await User.create({ email: 'danny@boy', password: 'howyadoin' })
      const user2 = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const pet = await Pet.create({ name: 'Aster', userUuid: user2.uuid })
      const collar = await Collar.create({ pet })

      const reloaded = await User.query().leftJoin('petsFromUuid', 'collars').all()
      expect(reloaded).toMatchDreamModels([user1, user2])

      const plucked = await User.query()
        .leftJoin('petsFromUuid', 'collars')
        .order('id')
        .pluck('id', 'collars.id')
      expect(plucked).toEqual([
        [user1.id, null],
        [user2.id, collar.id],
      ])
    })
  })

  context('implicit HasMany through', () => {
    it('sets HasMany property and through property on the model and BelongsToProperty on the associated model, including models that don’t have an associated model', async () => {
      const user1 = await User.create({ email: 'danny@boy', password: 'howyadoin' })
      const user2 = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const pet = await Pet.create({ name: 'Aster', userUuid: user2.uuid })
      const collar = await Collar.create({ pet })

      const reloaded = await User.query().leftJoin('collarsFromUuid').all()
      expect(reloaded).toMatchDreamModels([user1, user2])

      const plucked = await User.query()
        .leftJoin('collarsFromUuid')
        .order('id')
        .pluck('id', 'collarsFromUuid.id')
      expect(plucked).toEqual([
        [user1.id, null],
        [user2.id, collar.id],
      ])
    })
  })

  it('joins a HasOne through HasOne association, including models that don’t have an associated model', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const pet = await Pet.create({ name: 'Aster', userUuid: user2.uuid })
    const collar = await Collar.create({ pet })

    const reloadedUsers = await User.query().leftJoin('firstCollarFromUuid').all()
    expect(reloadedUsers).toMatchDreamModels([user1, user2])

    const plucked = await User.query()
      .leftJoin('firstCollarFromUuid')
      .order('id')
      .pluck('id', 'firstCollarFromUuid.id')
    expect(plucked).toEqual([
      [user1.id, null],
      [user2.id, collar.id],
    ])
  })

  context('nested through associations', () => {
    it('joins a HasMany through another through association, including models that don’t have an associated model', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const pet = await Pet.create({ name: 'Aster', userUuid: user2.uuid })
      const balloon = await Mylar.create({ color: 'red', user: user2 })
      await Collar.create({ pet, balloon })

      const reloadedUsers = await User.query().leftJoin('balloonsFromUuid').all()
      expect(reloadedUsers).toMatchDreamModels([user1, user2])

      const plucked = await User.query()
        .leftJoin('balloonsFromUuid')
        .order('id')
        .pluck('id', 'balloonsFromUuid.id')
      expect(plucked).toEqual([
        [user1.id, null],
        [user2.id, balloon.id],
      ])
    })
  })
})
