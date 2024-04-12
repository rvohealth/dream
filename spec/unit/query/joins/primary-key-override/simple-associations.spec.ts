import User from '../../../../../test-app/app/models/User'
import Pet from '../../../../../test-app/app/models/Pet'
import Collar from '../../../../../test-app/app/models/Collar'

describe('Query#joins with simple associations and overriding primary key', () => {
  it('joins a HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Pet.create({ userUuid: user.uuid })

    const reloadedUsers = await User.query().joins('firstPetFromUuid').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    await Pet.create({ userUuid: user.uuid })

    const reloadedUsers = await User.query().joins('petsFromUuid').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const pet = await Pet.create({ userUuid: user.uuid })

    const reloadedPets = await Pet.query().joins('userThroughUuid').all()
    expect(reloadedPets).toMatchDreamModels([pet])

    const noResults = await Pet.query().joins('user').all()
    expect(noResults).toEqual([])
  })

  context('nested', () => {
    it('loads specified associations', async () => {
      const user = await User.create({ email: 'danny@boy', password: 'howyadoin' })
      const pet = await Pet.create({ userUuid: user.uuid, name: 'Violet' })
      await Collar.create({ pet })

      const reloadedUsers = await User.query().joins('firstPetFromUuid', 'collars').all()
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
        .joins('petsFromUuid', { name: 'Violet' })
        .joins('petsFromUuid', 'collars', { tagName: 'Violet' })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user])

      const noResults1 = await User.query()
        .joins('petsFromUuid', { name: 'Aster' })
        .joins('petsFromUuid', 'collars', { tagName: 'Aster' })
        .all()
      expect(noResults1).toEqual([])

      const noResults2 = await User.query()
        .joins('petsFromUuid', { name: 'Violet' })
        .joins('petsFromUuid', 'collars', { tagName: 'Aster' })
        .all()
      expect(noResults2).toEqual([])
    })
  })
})
