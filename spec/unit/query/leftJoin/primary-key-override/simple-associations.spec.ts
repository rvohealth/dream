import Collar from '../../../../../test-app/app/models/Collar.js'
import Pet from '../../../../../test-app/app/models/Pet.js'
import User from '../../../../../test-app/app/models/User.js'

describe('Query#leftJoin with simple associations and overriding primary key', () => {
  it('joins a HasOne association, including models that don’t have an associated model', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const pet = await Pet.create({ userUuid: user2.uuid })

    const reloadedUsers = await User.query().leftJoin('firstPetFromUuid').all()
    expect(reloadedUsers).toMatchDreamModels([user1, user2])

    const plucked = await User.query()
      .leftJoin('firstPetFromUuid')
      .order('id')
      .pluck('id', 'firstPetFromUuid.id')
    expect(plucked).toEqual([
      [user1.id, null],
      [user2.id, pet.id],
    ])
  })

  it('joins a HasMany association, including models that don’t have an associated model', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const pet = await Pet.create({ userUuid: user2.uuid })

    const reloadedUsers = await User.query().leftJoin('petsFromUuid').all()
    expect(reloadedUsers).toMatchDreamModels([user1, user2])

    const plucked = await User.query().leftJoin('petsFromUuid').order('id').pluck('id', 'petsFromUuid.id')
    expect(plucked).toEqual([
      [user1.id, null],
      [user2.id, pet.id],
    ])
  })

  it('joins a BelongsTo association, including models that don’t have an associated model', async () => {
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const pet = await Pet.create({ userUuid: user.uuid })

    const reloadedPets = await Pet.query().leftJoin('userThroughUuid').all()
    expect(reloadedPets).toMatchDreamModels([pet])
    expect(await Pet.query().leftJoin('userThroughUuid').pluck('id', 'userThroughUuid.id')).toEqual([
      [pet.id, user.id],
    ])

    // the pet's userId is null, so joining through the default primary key matches nothing,
    // but the pet is still returned
    const stillLoaded = await Pet.query().leftJoin('user').all()
    expect(stillLoaded).toMatchDreamModels([pet])
    expect(await Pet.query().leftJoin('user').pluck('id', 'user.id')).toEqual([[pet.id, null]])
  })

  context('nested', () => {
    it('loads specified associations, including models that don’t have an associated model', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'danny@boy', password: 'howyadoin' })
      const pet = await Pet.create({ userUuid: user2.uuid, name: 'Violet' })
      const collar = await Collar.create({ pet })

      const reloadedUsers = await User.query().leftJoin('firstPetFromUuid', 'collars').all()
      expect(reloadedUsers).toMatchDreamModels([user1, user2])

      const plucked = await User.query()
        .leftJoin('firstPetFromUuid', 'collars')
        .order('id')
        .pluck('id', 'collars.id')
      expect(plucked).toEqual([
        [user1.id, null],
        [user2.id, collar.id],
      ])
    })
  })

  context('sibling joins', () => {
    it('loads specified associations, applying each and-clause to its own join', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'danny@boy', password: 'howyadoin' })
      const pet = await Pet.create({ userUuid: user2.uuid, name: 'Violet' })
      const collar = await Collar.create({ pet, tagName: 'Violet' })

      const reloadedUsers = await User.query()
        .leftJoin('petsFromUuid', { and: { name: 'Violet' } })
        .leftJoin('petsFromUuid', 'collars', { and: { tagName: 'Violet' } })
        .all()
      expect(reloadedUsers).toMatchDreamModels([user1, user2])

      const bothMatch = await User.query()
        .leftJoin('petsFromUuid', { and: { name: 'Violet' } })
        .leftJoin('petsFromUuid', 'collars', { and: { tagName: 'Violet' } })
        .order('id')
        .pluck('id', 'petsFromUuid.id', 'collars.id')
      expect(bothMatch).toEqual([
        [user1.id, null, null],
        [user2.id, pet.id, collar.id],
      ])

      // non-matching and-clauses do not drop the parents, they null out the joined columns
      const neitherMatch = await User.query()
        .leftJoin('petsFromUuid', { and: { name: 'Aster' } })
        .leftJoin('petsFromUuid', 'collars', { and: { tagName: 'Aster' } })
        .order('id')
        .pluck('id', 'petsFromUuid.id', 'collars.id')
      expect(neitherMatch).toEqual([
        [user1.id, null, null],
        [user2.id, null, null],
      ])

      const onlyPetMatches = await User.query()
        .leftJoin('petsFromUuid', { and: { name: 'Violet' } })
        .leftJoin('petsFromUuid', 'collars', { and: { tagName: 'Aster' } })
        .order('id')
        .pluck('id', 'petsFromUuid.id', 'collars.id')
      expect(onlyPetMatches).toEqual([
        [user1.id, null, null],
        [user2.id, pet.id, null],
      ])
    })
  })
})
