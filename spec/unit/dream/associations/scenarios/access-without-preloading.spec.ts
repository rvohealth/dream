import NonLoadedAssociation from '../../../../../src/errors/associations/NonLoadedAssociation.js'
import Mylar from '../../../../../test-app/app/models/Balloon/Mylar.js'
import HeartRating from '../../../../../test-app/app/models/ExtraRating/HeartRating.js'
import Post from '../../../../../test-app/app/models/Post.js'
import User from '../../../../../test-app/app/models/User.js'

describe('Accessing an association that hasn’t been loaded', () => {
  context('HasOne', () => {
    it('throws an NonLoadedAssociation exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      expect(() => user.userSettings).toThrow(NonLoadedAssociation)
    })
  })

  context('BelongsTo', () => {
    it('throws an NonLoadedAssociation exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const balloon = await Mylar.create({ user })
      const reloadedBalloon = await Mylar.find(balloon.id)
      expect(() => reloadedBalloon!.user).toThrow(NonLoadedAssociation)
    })
  })

  context('HasMany', () => {
    it('throws an NonLoadedAssociation exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      expect(() => user.compositions).toThrow(NonLoadedAssociation)
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
    it('reference the base class', async () => {
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
