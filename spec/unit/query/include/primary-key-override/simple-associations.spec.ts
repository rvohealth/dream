import Pet from '../../../../../test-app/app/models/Pet'
import User from '../../../../../test-app/app/models/User'

describe('Query#include with simple associations and overriding primary key', () => {
  context('HasOne', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const pet = await Pet.create({ userThroughUuid: user })

      const reloadedUser = (await User.query().include('firstPetFromUuid').all())[0]
      expect(reloadedUser.firstPetFromUuid).toMatchDreamModel(pet)
    })

    context('when the association does not exist', () => {
      it('sets it to null', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = (await User.query().include('firstPetFromUuid').all())[0]
        expect(reloadedUser.firstPetFromUuid).toBeNull()
      })
    })
  })

  context('HasMany', () => {
    it('loads the associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const pet1 = await Pet.create({ userThroughUuid: user })
      const pet2 = await Pet.create({ userThroughUuid: user })

      const reloadedUser = (await User.query().include('petsFromUuid').all())[0]
      expect(reloadedUser.petsFromUuid).toMatchDreamModels([pet1, pet2])
    })

    context('when no association exists', () => {
      it('sets it to an empty array', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = (await User.query().include('petsFromUuid').all())[0]
        expect(reloadedUser.petsFromUuid).toEqual([])
      })
    })
  })

  context('BelongsTo', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Pet.create({ userThroughUuid: user })
      const reloaded = (await Pet.query().include('userThroughUuid').all())[0]
      expect(reloaded.userThroughUuid).toMatchDreamModel(user)
    })
  })
})
