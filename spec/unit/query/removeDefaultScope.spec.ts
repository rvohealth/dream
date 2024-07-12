import User from '../../../test-app/app/models/User'
import Pet from '../../../test-app/app/models/Pet'
import { Query, Scope } from '../../../src'

describe('Dream#removeDefaultScope', () => {
  let user: User

  class PetNamedAster extends Pet {
    @Scope({ default: true })
    public static onlyAster(query: Query<PetNamedAster>) {
      return query.where({ name: 'aster' })
    }
  }

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
  })

  it('circumvents the default scope, allowing all other default scopes to apply', async () => {
    const pet1 = await PetNamedAster.create({ user, name: 'aster' })
    const pet2 = await PetNamedAster.create({ user, name: 'not aster' })

    expect(await PetNamedAster.query().all()).toMatchDreamModels([pet1])
    expect(await PetNamedAster.query().removeDefaultScope('onlyAster').all()).toMatchDreamModels([pet1, pet2])
  })

  context('with a dream-provided default scope', () => {
    context('dream:SoftDelete', () => {
      it('circumvents the SoftDelete scope, allowing all other default scopes to apply', async () => {
        const pet1 = await PetNamedAster.create({ user, name: 'aster' })
        const pet2 = await PetNamedAster.create({ user, name: 'not aster' })

        await pet1.destroy()
        await pet2.destroy()

        const reloadedPets = await PetNamedAster.query().removeDefaultScope('dream:SoftDelete').all()
        expect(reloadedPets).toMatchDreamModels([pet1])
      })
    })
  })
})
