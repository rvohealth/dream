import Collar from '../../../../../test-app/app/models/Collar'
import Pet from '../../../../../test-app/app/models/Pet'
import User from '../../../../../test-app/app/models/User'

describe('Query#joins with simple associations and overriding primary key', () => {
  it('joins a HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Pet.create({ userUuid: user.uuid })

    const reloadedUsers = await User.query().innerJoin('firstPetFromUuid').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Pet.create({ userUuid: user.uuid })

    const reloadedUsers = await User.query().innerJoin('petsFromUuid').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const pet = await Pet.create({ userUuid: user.uuid })

    const reloadedPets = await Pet.query().innerJoin('userThroughUuid').all()
    expect(reloadedPets).toMatchDreamModels([pet])

    const noResults = await Pet.query().innerJoin('user').all()
    expect(noResults).toEqual([])
  })

  context('nested', () => {
    it('loads specified associations', async () => {
      const user = await User.create({ email: 'danny@boy', password: 'howyadoin' })
      const pet = await Pet.create({ userUuid: user.uuid, name: 'Violet' })
      await Collar.create({ pet })

      const reloadedUsers = await User.query().innerJoin('firstPetFromUuid', 'collars').all()
      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  context('sibling joins', () => {
    it('loads specified associations', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'danny@boy', password: 'howyadoin' })
      const pet = await Pet.create({ userUuid: user.uuid, name: 'Violet' })
      await Collar.create({ pet, tagName: 'Violet' })

      const reloadedUsers = await User.query()
        .innerJoin('petsFromUuid', { on: { name: 'Violet' } })
        .innerJoin('petsFromUuid', 'collars', { on: { tagName: 'Violet' } })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults1 = await User.query()
        .innerJoin('petsFromUuid', { on: { name: 'Aster' } })
        .innerJoin('petsFromUuid', 'collars', { on: { tagName: 'Aster' } })
        .all()
      expect(noResults1).toEqual([])

      const noResults2 = await User.query()
        .innerJoin('petsFromUuid', { on: { name: 'Violet' } })
        .innerJoin('petsFromUuid', 'collars', { on: { tagName: 'Aster' } })
        .all()
      expect(noResults2).toEqual([])
    })
  })
})
