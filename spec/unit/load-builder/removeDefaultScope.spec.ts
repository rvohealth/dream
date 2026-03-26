import Collar from '../../../test-app/app/models/Collar.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('LoadBuilder#removeDefaultScope', () => {
  let user: User
  let pet: Pet

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    pet = await Pet.create({ user, name: 'aster' })
  })

  it('bypasses the specified default scope when loading associations', async () => {
    const hiddenCollar = await Collar.create({ pet, hidden: true })

    const loaded = await pet.load('collars').execute()
    expect(loaded.collars).toHaveLength(0)

    const loadedWithBypass = await pet.load('collars').removeDefaultScope('hideHiddenCollars').execute()
    expect(loadedWithBypass.collars).toMatchDreamModels([hiddenCollar])
  })

  it('bypasses the SoftDelete scope when loading associations', async () => {
    const collar = await Collar.create({ pet, hidden: false })
    await collar.destroy()

    const loaded = await pet.load('collars').execute()
    expect(loaded.collars).toHaveLength(0)

    const loadedWithBypass = await pet.load('collars').removeDefaultScope('dream:SoftDelete').execute()
    expect(loadedWithBypass.collars).toMatchDreamModels([collar])
  })

  it('can bypass multiple default scopes', async () => {
    const hiddenCollar = await Collar.create({ pet, hidden: true })
    await hiddenCollar.destroy()

    const loadedWithBypass = await pet
      .load('collars')
      .removeDefaultScope('hideHiddenCollars')
      .removeDefaultScope('dream:SoftDelete')
      .execute()
    expect(loadedWithBypass.collars).toMatchDreamModels([hiddenCollar])
  })
})
