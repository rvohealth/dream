import User from '../../../test-app/app/models/User.js'

describe('Dream.output', () => {
  it("surfaces the compiled sql statement for the 'sql' mode", async () => {
    const compiled = await User.output('sql').all()
    expect(compiled.sql).toEqual('select "users".* from "users" where "users"."deleted_at" is null')
  })

  it("surfaces the query plan for the 'explain' mode", async () => {
    const plan = await User.output('explain').all()
    expect(plan.join('\n')).toMatch(/users/)
  })

  it('composes with further query methods', async () => {
    const compiled = await User.output('sql').where({ email: 'how@yadoin' }).first()
    expect(compiled.sql).toContain('"users"."email" = $1')
  })
})
