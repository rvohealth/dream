import DreamDbConnection from '../../../src/db/DreamDbConnection.js'
import Composition from '../../../test-app/app/models/Composition.js'
import User from '../../../test-app/app/models/User.js'

describe('LoadBuilder#connection', () => {
  it('uses the specified connection when loading associations', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user })

    const spy = vi.spyOn(DreamDbConnection, 'getConnection')

    await user.load('compositions').connection('replica').execute()

    expect(spy).toHaveBeenCalledWith('default', 'replica', expect.anything())
  })

  it('defaults to primary connection', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await Composition.create({ user })

    const spy = vi.spyOn(DreamDbConnection, 'getConnection')

    await user.load('compositions').execute()

    expect(spy).toHaveBeenCalledWith('default', 'primary', expect.anything())
    expect(spy).not.toHaveBeenCalledWith('default', 'replica', expect.anything())
  })
})
