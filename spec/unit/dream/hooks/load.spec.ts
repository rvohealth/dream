import Composition from '../../../../test-app/app/models/Composition.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream#load', () => {
  it('loads (by deferring to #preload)', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, primary: true })

    const reloaded = await user.load('compositions').execute()
    expect(reloaded.compositions).toMatchDreamModels([composition])
  })
})
