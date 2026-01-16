import User from '../../../test-app/app/models/User.js'

describe('Dream#placeholder', () => {
  it('holds the place of an association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const user = await User.placeholder('posts').firstOrFail()
    expect(user.posts).toEqual([])
  })

  context('with an array provided', () => {
    it('holds the place of an association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const user = await User.placeholder(['posts', 'postComments']).firstOrFail()
      expect(user.posts).toEqual([])
      expect(user.postComments).toEqual([])
    })
  })
})
