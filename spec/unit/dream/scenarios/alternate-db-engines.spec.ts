import MysqlUser from '../../../../test-app/app/models/MysqlUser.js'

describe('leveraging alternate db engines', () => {
  context('mysql', () => {
    it('allows models to update and fetch data from alternate db engines', async () => {
      const user = await MysqlUser.create({
        email: 'hello@world',
        name: 'freddyboy',
      })

      expect(user.email).toEqual('hello@world')
      expect(user.name).toEqual('freddyboy')
      expect(user.isPersisted).toBe(true)

      await user.update({ email: 'goodbye@world' })
      const reloaded = await MysqlUser.findOrFail(user.id)
      expect(reloaded.email).toEqual('goodbye@world')
    })
  })
})
