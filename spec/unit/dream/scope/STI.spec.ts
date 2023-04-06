import User from '../../../../src/test-app/app/models/user'
import AdminUser from '../../../../src/test-app/app/models/admin-user'
import { DateTime } from 'luxon'

describe('Dream STI', () => {
  it('builds scope mapping', async () => {
    expect(User.sti.value).toEqual(null)
    expect(User.sti.column).toEqual(null)

    expect(AdminUser.sti.value).toEqual('AdminUser')
    expect(AdminUser.sti.column).toEqual('type')
  })

  it('auto-applies the type field for STI classes upon insertion', async () => {
    const user = await User.create({ email: 'how@ya0', password: 'doin', deleted_at: DateTime.now() })
    const adminUser = await AdminUser.create({
      email: 'how@ya0',
      password: 'doin',
      deleted_at: DateTime.now(),
    })
    expect(user.type).toEqual(null)
    expect(adminUser.type).toEqual('AdminUser')
  })

  it('auto-applies a default scope for classes implementing STI', async () => {
    const user = await User.create({ email: 'how@ya0', password: 'doin' })
    const adminUser = await AdminUser.create({
      email: 'how@ya0',
      password: 'doin',
    })

    const results = await AdminUser.all()
    expect(results.map(r => r.id)).toEqual([adminUser.id])
  })
})
