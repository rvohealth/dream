import Composition from '../../../src/test-app/app/models/composition'
import User from '../../../src/test-app/app/models/user'

describe('Dream#select', () => {
  it('select spec', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const records = await Composition.where({
      user_id: User.selectForWhere('users.id'),
    }).all()

    expect(records.length).toEqual(1)
    expect(records[0].attributes).toEqual(composition.attributes)
  })
})
