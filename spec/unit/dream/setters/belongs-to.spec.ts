import { sql } from 'kysely'
import db from '../../../../src/db'
import Composition from '../../../../test-app/app/models/Composition'
import Post from '../../../../test-app/app/models/Post'
import Rating from '../../../../test-app/app/models/Rating'
import User from '../../../../test-app/app/models/User'
import { DreamApplication } from '../../../../src'

describe('BelongsTo setters', () => {
  it('the getter is updated to the new model', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user })

    composition.user = otherUser
    expect(composition.user).toMatchDreamModel(otherUser)
  })

  it('updates the foreign key', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    composition.user = otherUser

    expect(composition.userId).toEqual(otherUser.id)
  })

  it('the original foreign key is stored in the changedAttributes foreign key', async () => {
    const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    const otherUser = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    composition.user = otherUser

    expect(composition.changedAttributes()).toEqual({ userId: user.id })
  })

  context('polymorphic', () => {
    it('updates the foreign key and the type', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const post = await Post.create({ user })
      const rating = await Rating.create({ user, rateable: composition })
      rating.rateable = post

      expect(rating.rateableId).toEqual(post.id)
      expect(rating.rateableType).toEqual('Post')
    })

    it('the original foreign key and type are stored in the changedAttributes foreign key and type', async () => {
      await sql`ALTER SEQUENCE compositions_id_seq RESTART 1;`.execute(
        db('primary', DreamApplication.getOrFail())
      )
      await sql`ALTER SEQUENCE posts_id_seq RESTART 100;`.execute(db('primary', DreamApplication.getOrFail()))

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const post = await Post.create({ user })
      const rating = await Rating.create({ user, rateable: composition })
      rating.rateable = post

      expect(rating.changedAttributes()).toEqual({
        rateableId: composition.id,
        rateableType: 'Composition',
      })
    })
  })
})
