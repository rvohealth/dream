import Latex from '../../../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../../../test-app/app/models/Balloon/Mylar.js'
import Collar from '../../../../../test-app/app/models/Collar.js'
import Pet from '../../../../../test-app/app/models/Pet.js'
import User from '../../../../../test-app/app/models/User.js'

describe('Query#joins through with simple associations and overriding primary key', () => {
  context('explicit HasMany through', () => {
    it('sets HasMany property on the model and BelongsToProperty on the associated model', async () => {
      await User.create({ email: 'danny@boy', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const pet = await Pet.create({ name: 'Aster', userUuid: user.uuid })
      await Collar.create({ pet })

      const reloaded = await User.query().innerJoin('petsFromUuid', 'collars').all()
      expect(reloaded).toMatchDreamModels([user])
    })
  })

  context('implicit HasMany through', () => {
    it('sets HasMany property and through property on the model and BelongsToProperty on the associated model', async () => {
      await User.create({ email: 'danny@boy', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const pet = await Pet.create({ name: 'Aster', userUuid: user.uuid })
      await Collar.create({ pet })

      const reloaded = await User.query().innerJoin('collarsFromUuid').all()
      expect(reloaded).toMatchDreamModels([user])
    })
  })

  it('joins a HasOne through HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const pet = await Pet.create({ name: 'Aster', userUuid: user.uuid })
    await Collar.create({ pet })

    const reloadedUsers = await User.query().innerJoin('firstCollarFromUuid').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('nested through associations', () => {
    it('joins a HasMany through another through association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const pet = await Pet.create({ name: 'Aster', userUuid: user.uuid })
      const balloon = await Mylar.create({ color: 'red', user })
      await Collar.create({ pet, balloon })

      const reloadedUsers = await User.query().innerJoin('balloonsFromUuid').all()
      expect(reloadedUsers).toMatchDreamModels([user])
    })

    it('restricts a through association targeting an STI child to that child', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const pet = await Pet.create({ name: 'Aster', userUuid: user.uuid })
      const mylar = await Mylar.create({ color: 'red', user })
      const latex = await Latex.create({ color: 'blue', user })
      await Collar.create({ pet, balloon: mylar })
      await Collar.create({ pet, balloon: latex })

      const siblingOnlyUser = await User.create({ email: 'lucy@peanuts', password: 'howyadoin' })
      const siblingOnlyPet = await Pet.create({ name: 'Snoopy', userUuid: siblingOnlyUser.uuid })
      const siblingOnlyLatex = await Latex.create({ color: 'green', user: siblingOnlyUser })
      await Collar.create({ pet: siblingOnlyPet, balloon: siblingOnlyLatex })

      expect(await User.innerJoin('mylarsFromUuid').all()).toMatchDreamModels([user])
      expect(await User.innerJoin('mylarsFromUuid').count()).toEqual(1)
    })
  })
})
