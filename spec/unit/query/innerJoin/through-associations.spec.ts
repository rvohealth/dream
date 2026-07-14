import MissingThroughAssociation from '../../../../src/errors/associations/MissingThroughAssociation.js'
import MissingThroughAssociationSource from '../../../../src/errors/associations/MissingThroughAssociationSource.js'
import ops from '../../../../src/ops/index.js'
import { DateTime } from '../../../../src/utils/datetime/DateTime.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import BalloonSpotter from '../../../../test-app/app/models/BalloonSpotter.js'
import BalloonSpotterBalloon from '../../../../test-app/app/models/BalloonSpotterBalloon.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import Post from '../../../../test-app/app/models/Post.js'
import PostComment from '../../../../test-app/app/models/PostComment.js'
import Rating from '../../../../test-app/app/models/Rating.js'
import ThroughA from '../../../../test-app/app/models/Through/A.js'
import ThroughAToOtherModelJoinModel from '../../../../test-app/app/models/Through/AToOtherModelJoinModel.js'
import ThroughB from '../../../../test-app/app/models/Through/B.js'
import ThroughMyModel from '../../../../test-app/app/models/Through/MyModel.js'
import ThroughOtherModel from '../../../../test-app/app/models/Through/OtherModel.js'
import User from '../../../../test-app/app/models/User.js'

describe('Query#joins through with simple associations', () => {
  context('explicit HasMany through', () => {
    it('sets HasMany property on the model and BelongsToProperty on the associated model', async () => {
      await BalloonSpotter.create()
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await BalloonSpotter.query().innerJoin('balloonSpotterBalloons', 'balloon').all()
      expect(reloaded).toMatchDreamModels([balloonSpotter])
    })
  })

  context('implicit HasMany through', () => {
    it('sets HasMany property and through property on the model and BelongsToProperty on the associated model', async () => {
      await BalloonSpotter.create()
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await BalloonSpotter.query().innerJoin('balloons').all()
      expect(reloaded).toMatchDreamModels([balloonSpotter])
    })

    context('default scopes', () => {
      let user: User
      let post: Post
      let postComment: PostComment

      beforeEach(async () => {
        user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        post = await Post.create({ user })
        postComment = await PostComment.create({ post, body: 'hello world', deletedAt: DateTime.now() })
      })

      it('applies default scopes to the join model', async () => {
        expect(await User.innerJoin('postComments').first()).toBeNull()
      })

      it('respects removal of all default scopes', async () => {
        expect(await User.removeAllDefaultScopes().innerJoin('postComments').first()).toMatchDreamModel(user)
      })

      it('respects removal of named default scopes', async () => {
        expect(
          await User.removeDefaultScope('dream:SoftDelete').innerJoin('postComments').first()
        ).toMatchDreamModel(user)
      })

      context('when the join model is excluded by a default scope', () => {
        it('excludes models joined through that join model', async () => {
          await post.destroy()
          await postComment.undestroy()

          expect(await Post.first()).toBeNull()
          expect(await PostComment.first()).toMatchDreamModel(postComment)
          expect(await Post.innerJoin('comments').first()).toBeNull()
          expect(await User.innerJoin('postComments').first()).toBeNull()
        })
      })
    })
  })

  it('joins a HasOne through HasOne association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, primary: true })
    await CompositionAsset.create({
      compositionId: composition.id,
      primary: true,
    })

    const reloadedUsers = await User.query().innerJoin('mainCompositionAsset').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  it('joins a HasMany through HasMany association', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id })
    await CompositionAsset.create({ compositionId: composition.id })

    const reloadedUsers = await User.query().innerJoin('compositionAssets').all()
    expect(reloadedUsers).toMatchDreamModels([user])
  })

  context('nested through associations', () => {
    it('joins a HasMany through another through association', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id })
      const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
      await CompositionAssetAudit.create({
        compositionAssetId: compositionAsset.id,
      })

      const reloadedUsers = await User.query().innerJoin('compositionAssetAudits').all()
      expect(reloadedUsers).toMatchDreamModels([user])
    })
  })

  describe('with where clause', () => {
    context('HasOne through HasOne', () => {
      it('joins', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id, primary: true })
        const compositionAsset = await CompositionAsset.create({
          compositionId: composition.id,
          primary: true,
        })

        const reloadedUsers = await User.query()
          .innerJoin('mainCompositionAsset', { and: { id: compositionAsset.id } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.query()
          .innerJoin('mainCompositionAsset', {
            and: { id: (parseInt(compositionAsset.id.toString()) + 1).toString() },
          })
          .all()
        expect(noResults).toEqual([])
      })

      context('with a similarity operator', () => {
        beforeEach(async () => {
          const foreignUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const foreignComposition = await Composition.create({
            user: foreignUser,
            primary: true,
          })
          await CompositionAsset.create({
            compositionId: foreignComposition.id,
            primary: true,
            name: 'goodbye',
          })
        })

        it('filters out results that do not match similarity text', async () => {
          const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
          const composition = await Composition.create({
            userId: user.id,
            primary: true,
          })
          await CompositionAsset.create({
            compositionId: composition.id,
            primary: true,
            name: 'hello',
          })

          const reloadedUsers = await User.query()
            .innerJoin('mainCompositionAsset', { and: { name: ops.similarity('hell') } })
            .all()
          expect(reloadedUsers).toMatchDreamModels([user])
        })
      })

      context('with another association after the where clause', () => {
        it('joins', async () => {
          await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
          const composition = await Composition.create({ userId: user.id, primary: true })
          await CompositionAsset.create({
            compositionId: composition.id,
            primary: true,
          })

          const reloadedUsers = await User.query()
            .innerJoin('compositions', { and: { id: composition.id } }, 'compositionAssets')
            .all()
          expect(reloadedUsers).toMatchDreamModels([user])

          const noResults = await User.query()
            .innerJoin(
              'compositions',
              { and: { id: (parseInt(composition.id.toString()) + 1).toString() } },
              'compositionAssets'
            )
            .all()
          expect(noResults).toEqual([])
        })
      })
    })

    context('HasOne through BelongsTo', () => {
      it('joins', async () => {
        const otherUser = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const otherComposition = await Composition.create({ userId: otherUser.id })
        await CompositionAsset.create({ compositionId: otherComposition.id })

        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

        const reloadedCompositionAssets = await CompositionAsset.query()
          .innerJoin('user', { and: { id: user.id } })
          .all()
        expect(reloadedCompositionAssets).toMatchDreamModels([compositionAsset])

        const noResults = await CompositionAsset.query()
          .innerJoin('user', { and: { id: (parseInt(user.id.toString()) + 1).toString() } })
          .all()
        expect(noResults).toEqual([])
      })
    })

    context('HasMany through HasMany', () => {
      it('joins a HasMany through HasMany association', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

        const reloadedUsers = await User.query()
          .innerJoin('compositionAssets', { and: { id: compositionAsset.id } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.query()
          .innerJoin('compositionAssets', {
            and: { id: (parseInt(compositionAsset.id.toString()) + 1).toString() },
          })
          .all()
        expect(noResults).toEqual([])
      })
    })

    context('nested through associations', () => {
      it('joins a HasMany through another through association', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
        const composition = await Composition.create({ userId: user.id })
        const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })
        const compositionAssetAudit = await CompositionAssetAudit.create({
          compositionAssetId: compositionAsset.id,
        })

        const reloadedUsers = await User.query()
          .innerJoin('compositionAssetAudits', { and: { id: compositionAssetAudit.id } })
          .all()
        expect(reloadedUsers).toMatchDreamModels([user])

        const noResults = await User.query()
          .innerJoin('compositionAssetAudits', {
            and: { id: (parseInt(compositionAssetAudit.id.toString()) + 1).toString() },
          })
          .all()
        expect(noResults).toEqual([])
      })
    })
  })

  context('with a where-clause-on-the-through-association', () => {
    context('explicit through', () => {
      context('join models that match the where clause', () => {
        it('are included in the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const recentComposition = await Composition.create({ user })

          const compositionAsset = await CompositionAsset.create({
            name: 'Hello',
            composition: recentComposition,
          })

          const reloadedUser = await User.innerJoin('recentCompositions', 'compositionAssets', {
            and: { name: compositionAsset.name },
          }).first()
          expect(reloadedUser).toMatchDreamModel(user)
        })

        context('with a deep similarity operator', () => {
          it('joins', async () => {
            const user1 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
            const composition1 = await Composition.create({ user: user1 })
            const compositionAsset1 = await CompositionAsset.create({
              compositionId: composition1.id,
              primary: true,
            })
            await CompositionAssetAudit.create({
              compositionAsset: compositionAsset1,
              notes: 'Hello',
            })

            const user2 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const composition2 = await Composition.create({ user: user2 })
            const compositionAsset2 = await CompositionAsset.create({
              compositionId: composition2.id,
              primary: true,
            })
            await CompositionAssetAudit.create({
              compositionAsset: compositionAsset2,
              notes: 'Goodbye',
            })

            const reloadedUsers = await User.query()
              .innerJoin('compositions', 'compositionAssets', 'compositionAssetAudits', {
                and: { notes: ops.similarity('hallo') },
              })
              .all()
            expect(reloadedUsers).toMatchDreamModels([user1])
          })

          context('with an association after the conditions', () => {
            it('joins', async () => {
              const user1 = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
              const composition1 = await Composition.create({ user: user1 })
              const compositionAsset1 = await CompositionAsset.create({
                compositionId: composition1.id,
                primary: true,
                name: 'hello',
              })
              await CompositionAssetAudit.create({
                compositionAsset: compositionAsset1,
                notes: 'Hello',
              })

              const user2 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
              const composition2 = await Composition.create({ user: user2 })
              const compositionAsset2 = await CompositionAsset.create({
                compositionId: composition2.id,
                primary: true,
                name: 'gabye',
              })
              await CompositionAssetAudit.create({
                compositionAsset: compositionAsset2,
                notes: 'Goodbye',
              })

              const reloadedUsers = await User.query()
                .innerJoin(
                  'compositions',
                  'compositionAssets',
                  { and: { name: ops.similarity('hallo') } },
                  'compositionAssetAudits',
                  {
                    and: { notes: ops.similarity('hallo') },
                  }
                )
                .all()
              expect(reloadedUsers).toMatchDreamModels([user1])
            })
          })
        })
      })

      context('join models that DO NOT match the where clause', () => {
        it('are omitted from the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const olderComposition = await Composition.create({
            user,
            createdAt: DateTime.now().minus({ year: 1 }),
          })

          const compositionAsset = await CompositionAsset.create({
            name: 'World',
            composition: olderComposition,
          })

          const reloadedUser = await User.innerJoin('recentCompositions', 'compositionAssets', {
            and: { name: compositionAsset.name },
          }).first()
          expect(reloadedUser).toBeNull()
        })
      })
    })

    context('implicit through', () => {
      context('join models that match the where clause', () => {
        it('are included in the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const recentComposition = await Composition.create({ user })

          await CompositionAsset.create({
            name: 'Hello',
            composition: recentComposition,
          })

          const reloadedUser = await User.innerJoin('recentCompositionAssets', {
            and: { name: 'Hello' },
          }).first()
          expect(reloadedUser).toMatchDreamModel(user)
        })

        context('HasMany through a HasMany that HasOne', () => {
          it('are included in the join', async () => {
            const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const recentComposition = await Composition.create({ user })

            await CompositionAsset.create({
              name: 'Hello',
              composition: recentComposition,
              primary: true,
            })

            const reloadedUser = await User.innerJoin('recentCompositionAssets', {
              and: { name: 'Hello' },
            }).first()
            expect(reloadedUser).toMatchDreamModel(user)
          })
        })
      })

      context('join models that DO NOT match the where clause', () => {
        it('are omitted from the join', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const olderComposition = await Composition.create({
            user,
            createdAt: DateTime.now().minus({ year: 1 }),
          })

          await CompositionAsset.create({
            name: 'World',
            composition: olderComposition,
          })

          const reloadedUser = await User.innerJoin('recentCompositionAssets', {
            and: { name: 'World' },
          }).first()
          expect(reloadedUser).toBeNull()
        })

        context('HasMany through a HasMany that HasOne', () => {
          it('are omitted from the join', async () => {
            const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
            const olderComposition = await Composition.create({
              user,
              createdAt: DateTime.now().minus({ year: 1 }),
            })

            await CompositionAsset.create({
              name: 'World',
              composition: olderComposition,
              primary: true,
            })

            const reloadedUser = await User.innerJoin('recentCompositionAssets', {
              and: { name: 'World' },
            }).first()
            expect(reloadedUser).toBeNull()
          })
        })
      })
    })
  })

  context('with a where clause on an implicit through association', () => {
    it('applies conditional to selectively bring in records', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })

      await pet.createAssociation('collars', { balloon: redBalloon })
      await pet.createAssociation('collars', { balloon: greenBalloon })

      const ids = await pet.associationQuery('and_red').pluck('id')
      expect(ids).toEqual([redBalloon.id])
    })
  })

  context('with a selfAnd clause', () => {
    it('applies conditional to selectively bring in records', async () => {
      const user = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        featuredPostPosition: 2,
      })

      // position is automatically set by sortable
      await Post.create({ user, body: 'hello' })
      const post2 = await Post.create({ user, body: 'world' })

      const plucked = await User.query()
        .innerJoin('featuredPost')
        .pluck('featuredPost.id', 'featuredPost.body')
      expect(plucked).toEqual([[post2.id, 'world']])
    })

    context('with an explicit alias', () => {
      it('references the explicit alias in the selfAnd condition', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
          featuredPostPosition: 2,
        })

        // position is automatically set by sortable
        await Post.create({ user, body: 'hello' })
        const post2 = await Post.create({ user, body: 'world' })

        const plucked = await User.query().innerJoin('featuredPost as fp').pluck('fp.id', 'fp.body')
        expect(plucked).toEqual([[post2.id, 'world']])
      })
    })

    context('with an explicit alias on an association bridging the selfAnd association', () => {
      it('applies the selfAnd condition to the intermediate join', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
          featuredPostPosition: 2,
        })

        // position is automatically set by sortable
        const post1 = await Post.create({ user, body: 'hello' })
        await Rating.create({ user, rateable: post1, rating: 3 })
        const post2 = await Post.create({ user, body: 'world' })
        const rating2 = await Rating.create({ user, rateable: post2, rating: 5 })

        const plucked = await User.query().innerJoin('featuredRatings as fr').pluck('fr.id')
        expect(plucked).toEqual([rating2.id])
      })
    })

    context('when the selfAnd is declared on the join association', () => {
      it('applies conditional to selectively bring in records', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
          targetRating: 7,
        })
        const post1 = await Post.create({ user })
        await Rating.create({ user, rateable: post1, rating: 3 })
        const rating1b = await Rating.create({ user, rateable: post1, rating: 7 })
        const post2 = await Post.create({ user })
        const rating2a = await Rating.create({ user, rateable: post2, rating: 7 })
        await Rating.create({ user, rateable: post2, rating: 5 })

        const plucked = await User.query()
          .innerJoin('ratingsThroughPostsThatMatchUserTargetRating')
          .pluck(
            'ratingsThroughPostsThatMatchUserTargetRating.id',
            'ratingsThroughPostsThatMatchUserTargetRating.rating'
          )
        expect(plucked).toHaveLength(2)
        expect(plucked).toEqual(
          expect.arrayContaining([
            [rating1b.id, 7],
            [rating2a.id, 7],
          ])
        )
      })

      context('with an explicit alias', () => {
        it('references the explicit alias in the selfAnd condition', async () => {
          const user = await User.create({
            email: 'fred@frewd',
            password: 'howyadoin',
            targetRating: 7,
          })
          const post1 = await Post.create({ user })
          await Rating.create({ user, rateable: post1, rating: 3 })
          const rating1b = await Rating.create({ user, rateable: post1, rating: 7 })

          const plucked = await User.query()
            .innerJoin('ratingsThroughPostsThatMatchUserTargetRating as r')
            .pluck('r.id', 'r.rating')
          expect(plucked).toEqual([[rating1b.id, 7]])
        })
      })
    })
  })

  context('with a whereNot clause on an implicit through association', () => {
    it('applies conditional to selectively bring in records', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })
      const blueBalloon = await Latex.create({ color: 'blue' })

      await pet.createAssociation('collars', { balloon: redBalloon })
      await pet.createAssociation('collars', { balloon: greenBalloon })
      await pet.createAssociation('collars', { balloon: blueBalloon })

      const ids = await pet.associationQuery('andNot_red').pluck('id')
      expect(ids.sort()).toEqual([greenBalloon.id, blueBalloon.id].sort())
    })
  })

  context('with a missing association', () => {
    it('throws MissingThroughAssociation', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = User.query().innerJoin('nonExtantCompositionAssets1').first()

      await expect(query).rejects.toThrow(MissingThroughAssociation)
    })
  })

  context('with a missing source', () => {
    it('throws MissingThroughAssociationSource', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = User.query().innerJoin('nonExtantCompositionAssets2').first()

      await expect(query).rejects.toThrow(MissingThroughAssociationSource)
    })
  })

  it('adds explicitly joined Dream classes to innerJoinDreamClasses', () => {
    const query = BalloonSpotter.query().innerJoin('balloonSpotterBalloons', 'balloon')
    expect(query['innerJoinDreamClasses']).toEqual([BalloonSpotterBalloon, Balloon])
  })

  it('adds implicitly joined Dream classes to innerJoinDreamClasses', () => {
    const query = BalloonSpotter.query().innerJoin('balloons')
    expect(query['innerJoinDreamClasses']).toEqual([BalloonSpotterBalloon, Balloon])
  })

  context('options on a through association whose source is itself a through association', () => {
    let myModel: ThroughMyModel

    beforeEach(async () => {
      myModel = await ThroughMyModel.create({ name: 'My model' })
    })

    context('and', () => {
      it('applies the and clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'Beautiful A')
        await createAReachableFrom(myModel, 'Plain A')

        const names = await ThroughMyModel.query().innerJoin('myAndA').pluck('myAndA.name')
        expect(names).toEqual(['Beautiful A'])
      })

      it('applies the and clause when bridged by a further through association', async () => {
        const beautifulA = await createAReachableFrom(myModel, 'Beautiful A')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await ThroughB.create({ name: 'B of beautiful A', a: beautifulA })
        await ThroughB.create({ name: 'B of plain A', a: plainA })

        const names = await ThroughMyModel.query().innerJoin('myAndB').pluck('myAndB.name')
        expect(names).toEqual(['B of beautiful A'])
      })

      context('with an explicit alias', () => {
        it('applies the and clause when joining the association directly', async () => {
          await createAReachableFrom(myModel, 'Beautiful A')
          await createAReachableFrom(myModel, 'Plain A')

          const names = await ThroughMyModel.query().innerJoin('myAndA as maa').pluck('maa.name')
          expect(names).toEqual(['Beautiful A'])
        })

        it('applies the and clause when bridged by a further through association', async () => {
          const beautifulA = await createAReachableFrom(myModel, 'Beautiful A')
          const plainA = await createAReachableFrom(myModel, 'Plain A')
          await ThroughB.create({ name: 'B of beautiful A', a: beautifulA })
          await ThroughB.create({ name: 'B of plain A', a: plainA })

          const names = await ThroughMyModel.query().innerJoin('myAndB as mab').pluck('mab.name')
          expect(names).toEqual(['B of beautiful A'])
        })
      })
    })

    context('andAny', () => {
      it('applies the andAny clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'Beautiful A')
        await createAReachableFrom(myModel, 'Gorgeous A')
        await createAReachableFrom(myModel, 'Plain A')

        const names = await ThroughMyModel.query().innerJoin('myAndAnyA').pluck('myAndAnyA.name')
        expect(names).toHaveLength(2)
        expect(names).toEqual(expect.arrayContaining(['Beautiful A', 'Gorgeous A']))
      })

      it('applies the andAny clause when bridged by a further through association', async () => {
        const beautifulA = await createAReachableFrom(myModel, 'Beautiful A')
        const gorgeousA = await createAReachableFrom(myModel, 'Gorgeous A')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await ThroughB.create({ name: 'B of beautiful A', a: beautifulA })
        await ThroughB.create({ name: 'B of gorgeous A', a: gorgeousA })
        await ThroughB.create({ name: 'B of plain A', a: plainA })

        const names = await ThroughMyModel.query().innerJoin('myAndAnyB').pluck('myAndAnyB.name')
        expect(names).toHaveLength(2)
        expect(names).toEqual(expect.arrayContaining(['B of beautiful A', 'B of gorgeous A']))
      })
    })

    context('andNot', () => {
      it('applies the andNot clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'Forgettable A')
        await createAReachableFrom(myModel, 'Plain A')

        const names = await ThroughMyModel.query().innerJoin('myAndNotA').pluck('myAndNotA.name')
        expect(names).toEqual(['Plain A'])
      })

      it('applies the andNot clause when bridged by a further through association', async () => {
        const forgettableA = await createAReachableFrom(myModel, 'Forgettable A')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await ThroughB.create({ name: 'B of forgettable A', a: forgettableA })
        await ThroughB.create({ name: 'B of plain A', a: plainA })

        const names = await ThroughMyModel.query().innerJoin('myAndNotB').pluck('myAndNotB.name')
        expect(names).toEqual(['B of plain A'])
      })
    })

    context('selfAnd', () => {
      it('applies the selfAnd clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'My model')
        await createAReachableFrom(myModel, 'Plain A')

        const names = await ThroughMyModel.query().innerJoin('mySelfAndA').pluck('mySelfAndA.name')
        expect(names).toEqual(['My model'])
      })

      it('applies the selfAnd clause when bridged by a further through association', async () => {
        const matchingA = await createAReachableFrom(myModel, 'My model')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await ThroughB.create({ name: 'B of matching A', a: matchingA })
        await ThroughB.create({ name: 'B of plain A', a: plainA })

        const names = await ThroughMyModel.query().innerJoin('mySelfAndB').pluck('mySelfAndB.name')
        expect(names).toEqual(['B of matching A'])
      })

      context('with an explicit alias', () => {
        it('applies the selfAnd clause when joining the association directly', async () => {
          await createAReachableFrom(myModel, 'My model')
          await createAReachableFrom(myModel, 'Plain A')

          const names = await ThroughMyModel.query().innerJoin('mySelfAndA as msa').pluck('msa.name')
          expect(names).toEqual(['My model'])
        })

        it('applies the selfAnd clause when bridged by a further through association', async () => {
          const matchingA = await createAReachableFrom(myModel, 'My model')
          const plainA = await createAReachableFrom(myModel, 'Plain A')
          await ThroughB.create({ name: 'B of matching A', a: matchingA })
          await ThroughB.create({ name: 'B of plain A', a: plainA })

          const names = await ThroughMyModel.query().innerJoin('mySelfAndB as msb').pluck('msb.name')
          expect(names).toEqual(['B of matching A'])
        })
      })
    })

    context('selfAndNot', () => {
      it('applies the selfAndNot clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'My model')
        await createAReachableFrom(myModel, 'Plain A')

        const names = await ThroughMyModel.query().innerJoin('mySelfAndNotA').pluck('mySelfAndNotA.name')
        expect(names).toEqual(['Plain A'])
      })

      it('applies the selfAndNot clause when bridged by a further through association', async () => {
        const matchingA = await createAReachableFrom(myModel, 'My model')
        const plainA = await createAReachableFrom(myModel, 'Plain A')
        await ThroughB.create({ name: 'B of matching A', a: matchingA })
        await ThroughB.create({ name: 'B of plain A', a: plainA })

        const names = await ThroughMyModel.query().innerJoin('mySelfAndNotB').pluck('mySelfAndNotB.name')
        expect(names).toEqual(['B of plain A'])
      })
    })

    context('order', () => {
      it('applies the order clause when joining the association directly', async () => {
        await createAReachableFrom(myModel, 'c')
        await createAReachableFrom(myModel, 'a')
        await createAReachableFrom(myModel, 'b')

        const names = await ThroughMyModel.query().innerJoin('myOrderedA').pluck('myOrderedA.name')
        expect(names).toEqual(['a', 'b', 'c'])
      })

      it('applies the order clause when bridged by a further through association', async () => {
        const cA = await createAReachableFrom(myModel, 'c')
        const aA = await createAReachableFrom(myModel, 'a')
        const bA = await createAReachableFrom(myModel, 'b')
        await ThroughB.create({ name: 'B of c', a: cA })
        await ThroughB.create({ name: 'B of a', a: aA })
        await ThroughB.create({ name: 'B of b', a: bA })

        const names = await ThroughMyModel.query().innerJoin('myOrderedB').pluck('myOrderedB.name')
        expect(names).toEqual(['B of a', 'B of b', 'B of c'])
      })
    })

    context('distinct', () => {
      it('applies the distinct clause when joining the association directly', async () => {
        const a = await createAReachableFrom(myModel, 'Shared A')
        await attachAToNewOtherModel(myModel, a)

        const duplicatedIds = await ThroughMyModel.query().innerJoin('myA').pluck('myA.id')
        expect(duplicatedIds).toEqual([a.id, a.id])

        const ids = await ThroughMyModel.query().innerJoin('myDistinctA').pluck('myDistinctA.id')
        expect(ids).toEqual([a.id])
      })

      it('applies the distinct clause when bridged by a further through association', async () => {
        const a = await createAReachableFrom(myModel, 'Shared A')
        await attachAToNewOtherModel(myModel, a)
        const b = await ThroughB.create({ name: 'B of shared A', a })

        const duplicatedIds = await ThroughMyModel.query().innerJoin('myB').pluck('myB.id')
        expect(duplicatedIds).toEqual([b.id, b.id])

        const ids = await ThroughMyModel.query().innerJoin('myDistinctB').pluck('myDistinctB.id')
        expect(ids).toEqual([b.id])
      })
    })
  })
})

async function createAReachableFrom(myModel: ThroughMyModel, name: string): Promise<ThroughA> {
  const otherModel = await ThroughOtherModel.create({ name: 'Other model', myModel })
  const a = await ThroughA.create({ name })
  await ThroughAToOtherModelJoinModel.create({ a, otherModel })
  return a
}

async function attachAToNewOtherModel(myModel: ThroughMyModel, a: ThroughA): Promise<void> {
  const otherModel = await ThroughOtherModel.create({ name: 'Other model', myModel })
  await ThroughAToOtherModelJoinModel.create({ a, otherModel })
}
