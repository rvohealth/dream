import { Updateable } from 'kysely'
import Composition from '../../../../src/test-app/app/models/composition'
import User from '../../../../src/test-app/app/models/user'
import { DB, Users } from '../../../../src/sync/schema'

describe('Dream AfterCreate decorator', () => {
  it('runs the query after creating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, content: 'change me after create' })
    expect(composition.content).toEqual('changed after create')
  })
})
