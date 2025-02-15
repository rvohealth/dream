import { DateTime } from 'luxon'
import MissingRequiredAssociationOnClause from '../../../../src/errors/associations/MissingRequiredAssociationOnClause'
import CannotPassUndefinedAsAValueToAWhereClause from '../../../../src/errors/CannotPassUndefinedAsAValueToAWhereClause'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import Collar from '../../../../test-app/app/models/Collar'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import LocalizedText from '../../../../test-app/app/models/LocalizedText'
import Pet from '../../../../test-app/app/models/Pet'
import Post from '../../../../test-app/app/models/Post'
import PostComment from '../../../../test-app/app/models/PostComment'
import User from '../../../../test-app/app/models/User'

describe('Dream#associationQuery', () => {
  context('with undefined passed in a where clause', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      await expect(
        async () => await user.associationQuery('pets', { on: { name: undefined } }).all()
      ).rejects.toThrowError(CannotPassUndefinedAsAValueToAWhereClause)
    })

    context('when undefined is applied at the association level', () => {
      context('where clause has an undefined value', () => {
        it('raises an exception', async () => {
          const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
          const post = await user.createAssociation('posts')

          await expect(
            async () => await post.associationQuery('invalidWherePostComments').all()
          ).rejects.toThrowError(CannotPassUndefinedAsAValueToAWhereClause)
        })
      })

      context('whereNot clause has an undefined value', () => {
        it('raises an exception', async () => {
          const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
          const post = await user.createAssociation('posts')

          await expect(
            async () => await post.associationQuery('invalidWhereNotPostComments').all()
          ).rejects.toThrowError(CannotPassUndefinedAsAValueToAWhereClause)
        })
      })
    })
  })

  context('with a HasMany association', () => {
    it('returns a chainable query encapsulating that association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user: otherUser })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const recentComposition = await Composition.create({ user })
      await Composition.create({
        user,
        createdAt: DateTime.now().minus({ year: 1 }),
      })

      expect(await user.associationQuery('recentCompositions').all()).toMatchDreamModels([recentComposition])
    })

    context('when a required where clause isn’t passed', () => {
      it('throws MissingRequiredAssociationWhereClause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        await expect(
          async () => await (composition.associationQuery as any)('requiredCurrentLocalizedText').all()
        ).rejects.toThrow(MissingRequiredAssociationOnClause)
      })
    })

    context('when a required where clause is passed', () => {
      it('applies the where clause to the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        await LocalizedText.create({ localizable: composition, locale: 'en-US' })
        const localizedText = await LocalizedText.create({ localizable: composition, locale: 'es-ES' })

        expect(
          await composition
            .associationQuery('requiredCurrentLocalizedText', { on: { locale: 'es-ES' } })
            .first()
        ).toMatchDreamModel(localizedText)
      })

      it('supports array where clauses', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const localizedText = await LocalizedText.create({ localizable: composition, locale: 'es-ES' })

        expect(
          await composition
            .associationQuery('requiredCurrentLocalizedText', { on: { locale: ['es-ES', 'de-DE'] } })
            .first()
        ).toMatchDreamModel(localizedText)
      })
    })

    context('withoutDefaultScopes defined on the association', () => {
      let user: User
      let post: Post
      let postComment: PostComment

      beforeEach(async () => {
        user = await User.create({ email: 'fred@frewd', password: 'password' })
        post = await Post.create({ user })
        postComment = await PostComment.create({ post })

        await post.destroy()
      })

      it('removes the default scopes defined on the association', async () => {
        expect(await user.associationQuery('posts').first()).toBeNull()
        expect(await user.associationQuery('allPosts').first()).toMatchDreamModel(post)
      })

      context('when preloading from the associationQuery an association with withoutDefaultScopes', () => {
        it('removes the default scopes defined on the preloaded association', async () => {
          const postWithNoComments = await user.associationQuery('allPosts').preload('comments').firstOrFail()
          expect(postWithNoComments.comments).toHaveLength(0)
          const postWithComments = await user
            .associationQuery('allPosts')
            .preload('allComments')
            .firstOrFail()
          expect(postWithComments.allComments).toMatchDreamModels([postComment])
        })
      })

      context(
        'when the association is through another association that also defines withoutDefaultScopes',
        () => {
          it('removes the default scopes from the assocation and the association it passes through', async () => {
            const noPostComments = await user.associationQuery('postComments').all()
            expect(noPostComments).toHaveLength(0)
            const allPostComments = await user.associationQuery('allPostComments').all()
            expect(allPostComments).toMatchDreamModels([postComment])
          })
        }
      )
    })

    context('with a primary key override', () => {
      it('utilizies primary key override', async () => {
        const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Pet.create({ userThroughUuid: otherUser })

        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const pet = await Pet.create({ userUuid: user.uuid })

        expect(await user.associationQuery('petsFromUuid').all()).toMatchDreamModels([pet])
      })
    })

    context('hasMany through', () => {
      it('returns a chainable query encapsulating that association', async () => {
        const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({ user: otherUser })

        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const recentComposition = await Composition.create({ user })
        const olderComposition = await Composition.create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const compositionAsset1 = await CompositionAsset.create({ composition: recentComposition })
        await CompositionAsset.create({ composition: olderComposition })

        expect(await user.associationQuery('recentCompositionAssets').all()).toMatchDreamModels([
          compositionAsset1,
        ])
      })

      context('with a primary key override', () => {
        it('utilizies primary key override', async () => {
          const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const otherPet = await Pet.create({ userThroughUuid: otherUser })
          await Collar.create({ pet: otherPet })

          const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
          const pet = await Pet.create({ userUuid: user.uuid })
          const collar = await Collar.create({ pet })

          expect(await user.associationQuery('collarsFromUuid').all()).toMatchDreamModels([collar])
        })
      })
    })

    it('supports chaining of where and findBy', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user, content: 'howyadoin' })
      await CompositionAsset.create({
        composition,
        name: 'asset 0',
        score: 1,
      })
      const compositionAsset = await CompositionAsset.create({
        composition,
        name: 'asset 1',
        score: 3,
      })

      expect(await user.associationQuery('compositionAssets').findBy({ score: 3 })).toMatchDreamModel(
        compositionAsset
      )

      expect(await user.associationQuery('compositionAssets').where({ score: 3 }).first()).toMatchDreamModel(
        compositionAsset
      )

      expect(await otherUser.associationQuery('compositionAssets').findBy({ score: 3 })).toBeNull()
    })

    it('supports calling destroy', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user, content: 'howyadoin' })
      const otherCompositionAsset = await CompositionAsset.create({
        composition,
        name: 'asset 0',
        score: 1,
      })
      const compositionAsset = await CompositionAsset.create({
        composition,
        name: 'asset 1',
        score: 3,
      })

      expect(await user.associationQuery('compositionAssets').all()).toMatchDreamModels([
        otherCompositionAsset,
        compositionAsset,
      ])
      expect(await user.associationQuery('compositionAssets').where({ score: 3 }).destroy())
      expect(await user.associationQuery('compositionAssets').all()).toMatchDreamModels([
        otherCompositionAsset,
      ])
    })

    it('supports chaining of subsequent joins', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const composition = await Composition.create({ user, content: 'howyadoin' })
      await CompositionAsset.create({
        composition,
        name: 'asset 0',
        score: 1,
      })
      await CompositionAsset.create({
        composition,
        name: 'asset 1',
        score: 3,
      })

      expect(
        await user
          .associationQuery('compositions')
          .innerJoin('compositionAssets', { on: { score: 3 } })
          .first()
      ).toMatchDreamModel(composition)

      expect(
        await user
          .associationQuery('compositions')
          .innerJoin('compositionAssets', { on: { score: 7 } })
          .first()
      ).toBeNull()

      expect(
        await user
          .associationQuery('compositions')
          .innerJoin('compositionAssets', 'compositionAssetAudits')
          .first()
      ).toBeNull()
    })

    context('with order applied to the association', () => {
      it('applies order', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const composition1 = await Composition.create({ user, content: 'a' })
        const composition3 = await Composition.create({ user, content: 'c' })
        const composition4 = await Composition.create({ user, content: 'd' })
        const composition2 = await Composition.create({ user, content: 'b' })

        const results = await user.associationQuery('sortedCompositions').all()
        expect(results[0]).toMatchDreamModel(composition1)
        expect(results[1]).toMatchDreamModel(composition2)
        expect(results[2]).toMatchDreamModel(composition3)
        expect(results[3]).toMatchDreamModel(composition4)
      })
    })

    context('with multiple order statements applied to the association', () => {
      it('applies order', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const composition1 = await Composition.create({ user, content: 'a' })
        const composition3 = await Composition.create({ user, content: 'a' })
        const composition4 = await Composition.create({ user, content: 'b' })
        const composition2 = await Composition.create({ user, content: 'b' })

        const results = await user.associationQuery('sortedCompositions2').all()
        expect(results[0]).toMatchDreamModel(composition3)
        expect(results[1]).toMatchDreamModel(composition1)
        expect(results[2]).toMatchDreamModel(composition2)
        expect(results[3]).toMatchDreamModel(composition4)
      })
    })
  })

  context('when in a transaction', () => {
    it('returns a chainable query encapsulating that association', async () => {
      const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user: otherUser })

      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const recentComposition = await Composition.create({ user })
      await Composition.create({
        user,
        createdAt: DateTime.now().minus({ year: 1 }),
      })

      await ApplicationModel.transaction(async txn => {
        expect(await user.txn(txn).associationQuery('recentCompositions').all()).toMatchDreamModels([
          recentComposition,
        ])
      })
    })

    context('with a primary key override', () => {
      it('utilizies primary key override', async () => {
        let user: User | undefined = undefined
        let otherUser: User | undefined = undefined
        let pet: Pet | undefined = undefined

        await ApplicationModel.transaction(async txn => {
          otherUser = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
          await Pet.txn(txn).create({ userThroughUuid: otherUser })

          user = await User.txn(txn).create({ email: 'fred@fred', password: 'howyadoin' })
          pet = await Pet.txn(txn).create({ userUuid: user.uuid })
        })

        expect(await user!.associationQuery('petsFromUuid').all()).toMatchDreamModels([pet])
      })
    })

    context('when a required where clause is passed', () => {
      it('applies the where clause to the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        await LocalizedText.create({ localizable: composition, locale: 'en-US' })
        const localizedText = await LocalizedText.create({ localizable: composition, locale: 'es-ES' })

        await ApplicationModel.transaction(async txn => {
          expect(
            await composition
              .txn(txn)
              .associationQuery('requiredCurrentLocalizedText', { on: { locale: 'es-ES' } })
              .first()
          ).toMatchDreamModel(localizedText)
        })
      })

      it('supports array where clauses', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const localizedText = await LocalizedText.create({ localizable: composition, locale: 'es-ES' })

        await ApplicationModel.transaction(async txn => {
          expect(
            await composition
              .txn(txn)
              .associationQuery('requiredCurrentLocalizedText', { on: { locale: ['es-ES', 'de-DE'] } })
              .first()
          ).toMatchDreamModel(localizedText)
        })
      })
    })
  })

  context('BelongsTo', () => {
    context('withoutDefaultScopes defined on the association', () => {
      it('removes the default scope', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'password' })
        const post = await Post.create({ user })
        const postComment = await PostComment.create({ post })

        await post.destroy()

        expect(await postComment.associationQuery('post').first()).toBeNull()
        expect(await postComment.associationQuery('postEvenIfDeleted').first()).toMatchDreamModel(post)
      })
    })
  })

  context('when chaining a subsequent where(null) clause', () => {
    it('does not override where clauses applied directly to the association', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      await Collar.create({ pet, balloon: redBalloon })

      const notRedBalloon = await Latex.create({ color: 'blue' })
      await Collar.create({ pet, balloon: notRedBalloon })

      expect(await pet.associationQuery('where_red').where(null).all()).toMatchDreamModels([redBalloon])
    })
  })

  context('removeAllDefaultScopes', () => {
    it('removes all default scopes', async () => {
      const user = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        deletedAt: DateTime.now(),
      })
      const balloon = await Latex.create({ user, color: 'red', deletedAt: DateTime.now() })

      const query = user.associationQuery('balloons')

      const balloons = await query.all()
      expect(balloons).toEqual([])

      const unscopedBalloons = await query.removeAllDefaultScopes().all()
      expect(unscopedBalloons).toMatchDreamModels([balloon])
    })
  })

  context('removeDefaultScope', () => {
    it('removes selected default scope', async () => {
      const user = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
      })
      const balloon = await Latex.create({ user, color: 'red', deletedAt: DateTime.now() })

      const query = user.associationQuery('balloons')

      const balloons = await query.all()
      expect(balloons).toEqual([])

      const unscopedBalloons = await query.removeDefaultScope('dream:SoftDelete').all()
      expect(unscopedBalloons).toMatchDreamModels([balloon])
    })
  })

  context('with specific columns to select', () => {
    it('only selects those fields', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'password' })
      await Post.create({ user, body: 'Hello world', position: 1 })

      const posts = await user.associationQuery('posts').all({ columns: ['position'] })
      expect(posts[0].position).toEqual(1)
      expect(posts[0].body).toBeUndefined()
    })
  })
})
