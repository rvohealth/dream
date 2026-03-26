import Collar from '../../../test-app/app/models/Collar.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('LoadBuilder#removeAllDefaultScopes', () => {
  let user: User
  let pet: Pet

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    pet = await Pet.create({ user, name: 'aster' })
  })

  it('bypasses all default scopes when loading associations', async () => {
    const hiddenCollar = await Collar.create({ pet, hidden: true })
    await hiddenCollar.destroy()

    const loaded = await pet.load('collars').execute()
    expect(loaded.collars).toHaveLength(0)

    const loadedWithBypass = await pet.load('collars').removeAllDefaultScopes().execute()
    expect(loadedWithBypass.collars).toMatchDreamModels([hiddenCollar])
  })
})
