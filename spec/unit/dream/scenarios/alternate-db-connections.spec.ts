import AlternateDbConnectionUser from '../../../../test-app/app/models/AlternateDbConnectionUser.js'

describe('leveraging alternate db connections', () => {
  it('allows models to update and fetch data from alternate database connections', async () => {
    const alternateUser = await AlternateDbConnectionUser.create({ email: 'hello@world', name: 'freddyboy' })

    expect(alternateUser.email).toEqual('hello@world')
    expect(alternateUser.name).toEqual('freddyboy')
    expect(alternateUser.isPersisted).toBe(true)

    await alternateUser.update({ email: 'goodbye@world' })
    const reloaded = await AlternateDbConnectionUser.findOrFail(alternateUser.id)
    expect(reloaded.email).toEqual('goodbye@world')
  })
})
