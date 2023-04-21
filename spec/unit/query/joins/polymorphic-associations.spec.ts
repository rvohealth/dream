import User from '../../../../test-app/app/models/user'
import Composition from '../../../../test-app/app/models/composition'
import CompositionAsset from '../../../../test-app/app/models/composition-asset'
import CompositionAssetAudit from '../../../../test-app/app/models/composition-asset-audit'
import Rating from '../../../../test-app/app/models/rating'
import Post from '../../../../test-app/app/models/post'
import CannotJoinPolymorphicBelongsToError from '../../../../src/exceptions/cannot-join-polymorphic-belongs-to-error'

describe('Query#joins with polymorphic associations', () => {
  it('joins a HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    const reloadedUsers = await User.limit(2).joins('mainComposition').all()
    expect(reloadedUsers!).toMatchObject([user])
  })

  it('from a BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const post = await Post.create({ user_id: user.id })
    const rating = await Rating.create({ user_id: user.id, rateable_id: post.id, rateable_type: 'Post' })

    expect(async () => await Rating.limit(2).joins('rateable').first()).rejects.toThrowError(
      CannotJoinPolymorphicBelongsToError
    )
  })

  it('joins a HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })

    const reloadedUsers = await User.limit(2).joins('compositions').all()
    expect(reloadedUsers!).toMatchObject([user])
  })

  context('with a where clause', () => {
    it('joins a HasOne association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })

      const reloadedUsers = await User.limit(2)
        .joins('mainComposition')
        .where({ mainComposition: { id: composition.id } })
        .all()
      expect(reloadedUsers!).toMatchObject([user])

      const noResults = await User.limit(2)
        .joins('mainComposition')
        .where({ mainComposition: { id: composition.id + 1 } })
        .all()
      expect(noResults).toMatchObject([])
    })

    it('joins a HasMany association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })

      const reloadedUsers = await User.limit(2)
        .joins('compositions')
        .where({ compositions: { id: composition.id } })
        .all()
      expect(reloadedUsers!).toMatchObject([user])

      const noResults = await User.limit(2)
        .joins('compositions')
        .where({ compositions: { id: composition.id + 1 } })
        .all()
      expect(noResults).toMatchObject([])
    })

    it('joins a BelongsTo association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user_id: otherUser.id })

      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id })

      const reloadedComposition = await Composition.limit(2)
        .joins('user')
        .where({ user: { id: user.id } })
        .all()
      expect(reloadedComposition).toMatchObject([composition])

      const noResults = await Composition.limit(2)
        .joins('user')
        .where({ user: { id: user.id + 1 } })
        .all()
      expect(noResults).toMatchObject([])
    })

    context('when passed an object', () => {
      it('loads specified associations', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })

        const composition = await Composition.create({ user_id: user.id })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

        const reloadedUsers = await User.limit(2)
          .joins({ mainComposition: 'compositionAssets' })
          .where({ mainComposition: { compositionAssets: { id: compositionAsset.id } } })
          .all()
        expect(reloadedUsers).toMatchObject([user])

        const noResults = await User.limit(2)
          .joins({ mainComposition: 'compositionAssets' })
          .where({ mainComposition: { compositionAssets: { id: compositionAsset.id + 1 } } })
          .all()
        expect(noResults).toMatchObject([])
      })
    })

    context('when passed an array', () => {
      it('loads specified associations', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ user_id: user.id })
        const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

        const reloadedUsers = await User.limit(2)
          .joins(['compositions', { mainComposition: 'compositionAssets' }])
          .where([
            {
              compositions: { id: composition.id },
            },
            {
              mainComposition: { compositionAssets: { id: compositionAsset.id } },
            },
          ])
          .all()
        expect(reloadedUsers).toMatchObject([user])

        const noResults1 = await User.limit(2)
          .joins(['compositions', { mainComposition: 'compositionAssets' }])
          .where([
            {
              compositions: { id: composition.id + 1 },
            },
            {
              mainComposition: { compositionAssets: { id: compositionAsset.id } },
            },
          ])
          .all()
        expect(noResults1).toMatchObject([])

        const noResults2 = await User.limit(2)
          .joins(['compositions', { mainComposition: 'compositionAssets' }])
          .where([
            {
              compositions: { id: composition.id },
            },
            {
              mainComposition: { compositionAssets: { id: compositionAsset.id + 1 } },
            },
          ])
          .all()
        expect(noResults2).toMatchObject([])
      })
    })
  })
})
