import NonLoadedAssociation from '../../../../src/exceptions/associations/non-loaded-association'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating'
import Post from '../../../../test-app/app/models/Post'
import User from '../../../../test-app/app/models/User'

describe('Accessing an association that hasn’t been loaded', () => {
  context('HasOne', () => {
    it('throws an NonLoadedAssociation exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      expect(() => user.userSettings).toThrowError(NonLoadedAssociation)
    })
  })

  context('BelongsTo', () => {
    it('throws an NonLoadedAssociation exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const balloon = await Mylar.create({ user })
      const reloadedBalloon = await Mylar.find(balloon.id)
      expect(() => reloadedBalloon!.user).toThrowError(NonLoadedAssociation)
    })
  })

  context('HasMany', () => {
    it('throws an NonLoadedAssociation exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      expect(() => user.compositions).toThrowError(NonLoadedAssociation)
    })
  })

  it('are only defined on instances of classes that define them', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    expect((user as any).collars).toBeUndefined()
  })

  it('reference the correct class in the exception', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const post = await Post.create({ user })

    const reloaded = await Post.find(post.id)

    let message = ''

    try {
      reloaded!.user
    } catch (err) {
      message = (err as any).message
    }

    expect(message).toMatch('Attempting to access `user` on an instance of `Post`')
  })

  context('STI model', () => {
    it('reference the correct class in the exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user })
      const rating = await HeartRating.create({ user, extraRateable: post })

      const reloaded = await HeartRating.find(rating.id)

      let message = ''

      try {
        reloaded!.user
      } catch (err) {
        message = (err as any).message
      }

      expect(message).toMatch('Attempting to access `user` on an instance of `HeartRating`')
    })
  })
})
