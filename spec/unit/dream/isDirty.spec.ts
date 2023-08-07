import Post from '../../../test-app/app/models/Post'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

describe('Dream#isDirty', () => {
  it('reflects being dirty when dirty', async () => {
    const user = User.new({ email: 'ham@', password: 'chalupas' })
    expect(user.isDirty).toEqual(true)

    await user.save()
    expect(user.isDirty).toEqual(false)

    user.email = 'ham@'
    expect(user.isDirty).toEqual(false)

    user.email = 'fish@'
    expect(user.isDirty).toEqual(true)

    user.email = 'ham@'
    expect(user.isDirty).toEqual(false)
  })

  context('with a blank record', () => {
    it('considers record to be dirty, even though no new attributes are being set explicitly', () => {
      const user = User.new()
      expect(user.isDirty).toEqual(true)
    })
  })

  context('with unsaved associations', () => {
    context('with an unsaved association', () => {
      it('considers a record dirty when an association has unsaved changes', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const post = await Post.create({ user })
        expect(post.isDirty).toEqual(false)
        user.email = 'calvin@coolidge'
        expect(post.isDirty).toEqual(true)
      })
    })

    context('with an unsaved nested association', () => {
      it('considers a record dirty when a nested association has unsaved changes', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const post = await Post.create({ user })
        const rating = await Rating.create({ rateable: post, rating: 10, user })
        await rating.load('rateable', 'user').execute()

        expect(rating.isDirty).toEqual(false)
        rating.rateable.user.email = 'calvin@coolidge'
        expect(rating.isDirty).toEqual(true)
      })
    })
  })
})
