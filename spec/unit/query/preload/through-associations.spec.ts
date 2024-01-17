import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit'
import { DateTime } from 'luxon'
import MissingThroughAssociationSource from '../../../../src/exceptions/associations/missing-through-association-source'
import BalloonSpotter from '../../../../test-app/app/models/BalloonSpotter'
import BalloonSpotterBalloon from '../../../../test-app/app/models/BalloonSpotterBalloon'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Sandbag from '../../../../test-app/app/models/Sandbag'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating'
import Pet from '../../../../test-app/app/models/Pet'
import JoinAttemptedOnMissingAssociation from '../../../../src/exceptions/associations/join-attempted-with-missing-association'
import Collar from '../../../../test-app/app/models/Collar'
import Post from '../../../../test-app/app/models/Post'
import Rating from '../../../../test-app/app/models/Rating'
import Node from '../../../../test-app/app/models/Graph/Node'
import Edge from '../../../../test-app/app/models/Graph/Edge'

describe('Query#preload through', () => {
  context('explicit HasMany through a BelongsTo', () => {
    it('sets HasMany property on the model and BelongsToProperty on the associated model', async () => {
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      const balloonSpotterBalloon = await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await BalloonSpotter.query().preload('balloonSpotterBalloons', 'balloon').first()
      expect(reloaded!.balloonSpotterBalloons).toMatchDreamModels([balloonSpotterBalloon])
      expect(reloaded!.balloonSpotterBalloons[0].balloon).toMatchDreamModel(balloon)
    })
  })

  context('implicit HasMany through a BelongsTo', () => {
    it('sets HasMany property', async () => {
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      const balloonSpotterBalloon = await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await BalloonSpotter.query().preload('balloons').first()
      expect(reloaded!.balloons).toMatchDreamModels([balloon])
    })

    context('when the join model does not have an associated BelongsTo', () => {
      it('returns an array without null values', async () => {
        const balloon = await Latex.create()
        const balloonSpotter = await BalloonSpotter.create()
        const balloonSpotterBalloon = await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

        const reloaded = await BalloonSpotter.query().preload('users').first()
        expect(reloaded!.users).toEqual([])
      })
    })
  })

  context('combined explicit and implicit on the same HasMany through', () => {
    it('sets HasMany property on the model and BelongsToProperty on the associated model', async () => {
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const balloonSpotterBalloon = await BalloonSpotterBalloon.create({ balloonSpotter, balloon, user })

      const reloaded = await BalloonSpotter.query()
        .preload('balloonSpotterBalloons', 'user')
        .preload('balloons')
        .first()
      expect(reloaded!.balloons).toMatchDreamModels([balloon])
      expect(reloaded!.balloonSpotterBalloons).toMatchDreamModels([balloonSpotterBalloon])
      expect(reloaded!.balloonSpotterBalloons[0].user).toMatchDreamModel(user)
    })
  })

  context('HasOne through HasOne association', () => {
    it('sets the HasOne association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })
      await CompositionAsset.create({ composition })
      const compositionAsset = await CompositionAsset.create({
        composition,
        primary: true,
      })

      const reloadedUser = await User.query().preload('mainCompositionAsset').first()
      expect(reloadedUser!.mainCompositionAsset).toMatchDreamModel(compositionAsset)
    })

    context('when there is no associated model', () => {
      it('sets the association property and the join association property to null', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = await User.query().preload('mainCompositionAsset').first()
        expect(reloadedUser!.mainCompositionAsset).toBeNull()
      })
    })
  })

  context('explicit HasMany through HasOne', () => {
    it('sets HasOne association property on the base model and the HasMany property on the assocaited model', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({
        composition,
        primary: true,
      })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        compositionAsset,
      })

      const reloadedComposition = await Composition.query()
        .preload('mainCompositionAsset', 'compositionAssetAudits')
        .first()
      expect(reloadedComposition!.mainCompositionAsset).toMatchDreamModel(compositionAsset)
      expect(reloadedComposition!.mainCompositionAsset.compositionAssetAudits).toMatchDreamModels([
        compositionAssetAudit,
      ])
    })

    context('when the join model does not have an associated HasOne', () => {
      it('returns an array without null values', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const balloon = await Latex.create({ user })
        const reloaded = await User.preload('balloonLines').first()
        expect(reloaded!.balloonLines).toEqual([])
      })
    })

    context('multiple, final preload', () => {
      it('preload all of the specified associations', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user, primary: true })
        const compositionAsset = await CompositionAsset.create({ composition })
        const compositionAsset2 = await CompositionAsset.create({ composition })
        const heartRating = await HeartRating.create({
          user,
          extraRateable: composition,
        })

        const reloaded = await User.query()
          .preload('mainComposition', ['compositionAssets', 'heartRatings'])
          .first()
        expect(reloaded!.mainComposition).toMatchDreamModel(composition)
        expect(reloaded!.mainComposition.compositionAssets).toMatchDreamModels([
          compositionAsset,
          compositionAsset2,
        ])
        expect(reloaded!.mainComposition.heartRatings).toMatchDreamModels([heartRating])
      })
    })

    context('when there are no models associated via the HasMany', () => {
      it('sets HasMany association to an empty array', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const compositionAsset = await CompositionAsset.create({
          composition,
          primary: true,
        })

        const reloadedComposition = await Composition.query()
          .preload('mainCompositionAsset', 'compositionAssetAudits')
          .first()
        expect(reloadedComposition!.mainCompositionAsset.compositionAssetAudits).toEqual([])
      })
    })

    context('when the join model doesn’t exist', () => {
      it('sets HasOne association property on the base model to null', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        const reloadedComposition = await Composition.query()
          .preload('mainCompositionAsset', 'compositionAssetAudits')
          .first()
        expect(reloadedComposition!.mainCompositionAsset).toBeNull()
      })
    })

    context('when including an association that exists on one of the STI children and not the other', () => {
      it('sets HasOne association property on the STI child that has the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const latex = await Latex.create({ color: 'blue', user })
        const mylar = await Mylar.create({ color: 'red', user })
        const sandbag = await Sandbag.create({ mylar })

        const reloaded = await User.query().preload('balloons', 'sandbags').order('id', 'asc').first()
        expect(reloaded!.balloons).toMatchDreamModels([latex, mylar])
        if (reloaded!.balloons[1].constructor === Mylar)
          expect((reloaded!.balloons[1] as Mylar).sandbags).toMatchDreamModels([sandbag])
        else expect((reloaded!.balloons[0] as Mylar).sandbags).toMatchDreamModels([sandbag])
      })

      context("when the query doesn't include any STI child that has the association", () => {
        it('the models without the association are loaded successfully', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const latex = await Latex.create({ color: 'blue', user })

          const reloaded = await User.query().preload('balloons', 'sandbags').order('id', 'asc').first()
          expect(reloaded!.balloons[0]).toMatchDreamModel(latex)
        })
      })
    })
  })

  context('implicit HasMany through HasOne', () => {
    it('sets the HasMany association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({
        composition,
        primary: true,
      })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        compositionAsset,
      })

      const reloadedComposition = await Composition.query().preload('mainCompositionAssetAudits').first()
      expect(reloadedComposition!.mainCompositionAssetAudits).toMatchDreamModels([compositionAssetAudit])
    })

    context('when there are no models associated via the HasMany', () => {
      it('sets the HasMany association to an empty array', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        const compositionAsset = await CompositionAsset.create({
          composition,
          primary: true,
        })

        const reloadedComposition = await Composition.query().preload('mainCompositionAssetAudits').first()
        expect(reloadedComposition!.mainCompositionAssetAudits).toEqual([])
      })
    })
  })

  context('with NON-matching where-clause-on-the-association', () => {
    it('sets the association to null', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })
      await CompositionAsset.create({ composition })
      const compositionAsset = await CompositionAsset.create({
        composition,
        primary: false,
      })

      const reloadedUser = await User.query().preload('mainCompositionAsset').first()
      expect(reloadedUser!.mainCompositionAsset).toBeNull()
    })
  })

  it('loads a HasOne through BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    await CompositionAsset.create({ composition })

    const reloadedCompositionAsset = await CompositionAsset.query().preload('user').first()
    expect(reloadedCompositionAsset!.user).toMatchDreamModel(user)
  })

  context('HasMany through HasMany association', () => {
    it('loads the included association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })
      const compositionAsset = await CompositionAsset.create({ composition })

      const reloadedUser = await User.query().preload('compositionAssets').first()
      expect(reloadedUser!.compositionAssets).toMatchDreamModels([compositionAsset])
    })

    context('when there are no associated models', () => {
      it('sets the association to an empty array', async () => {
        await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const users = await User.query().preload('compositionAssets').all()
        expect(users[0].compositionAssets).toEqual([])
      })
    })
  })

  context('nested through associations', () => {
    it('loads a HasMany through a HasMany through a HasMany', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({ composition })
      const compositionAssetAudit = await CompositionAssetAudit.create({
        compositionAssetId: compositionAsset.id,
      })

      const reloadedUser = await User.query().preload('compositionAssetAudits').first()
      expect(reloadedUser!.compositionAssetAudits).toMatchDreamModels([compositionAssetAudit])
    })

    it('loads a HasOne through a HasOne through a BelongsTo', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({ composition })
      await CompositionAssetAudit.create({
        compositionAssetId: compositionAsset.id,
      })

      const reloaded = await CompositionAssetAudit.query().preload('user').first()
      expect(reloaded!.user).toMatchDreamModel(user)
    })
  })

  context('with a where-clause-on-the-through-association', () => {
    context('explicit through association', () => {
      it('loads objects matching the where clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const recentComposition = await Composition.create({ user })
        const olderComposition = await Composition.create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const compositionAsset1 = await CompositionAsset.create({ composition: recentComposition })
        const compositionAsset2 = await CompositionAsset.create({ composition: olderComposition })

        const reloadedUser = await User.query().preload('recentCompositions', 'compositionAssets').first()
        expect(reloadedUser!.recentCompositions[0].compositionAssets).toMatchDreamModels([compositionAsset1])
      })
    })

    context('implicit through association', () => {
      it('loads objects matching the where clause', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const recentComposition = await Composition.create({ user })
        const olderComposition = await Composition.create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const compositionAsset1 = await CompositionAsset.create({ composition: recentComposition })
        const compositionAsset2 = await CompositionAsset.create({ composition: olderComposition })

        const reloadedUser = await User.query().preload('recentCompositionAssets').first()
        expect(reloadedUser).toMatchDreamModel(user)
        expect(reloadedUser!.recentCompositionAssets).toMatchDreamModels([compositionAsset1])
      })

      context('HasMany through a HasMany that HasOne', () => {
        it('loads objects matching the where clause', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const recentComposition = await Composition.create({ user })
          const olderComposition = await Composition.create({
            user,
            createdAt: DateTime.now().minus({ year: 1 }),
          })

          const compositionAsset1 = await CompositionAsset.create({
            composition: recentComposition,
            primary: true,
          })
          const compositionAsset2 = await CompositionAsset.create({
            composition: olderComposition,
            primary: true,
          })

          const reloadedUser = await User.query().preload('recentCompositionAssets').first()
          expect(reloadedUser).toMatchDreamModel(user)
          expect(reloadedUser!.recentCompositionAssets).toMatchDreamModels([compositionAsset1])
        })
      })

      context('with selfWhere clause', () => {
        it('loads the associated models', async () => {
          const user = await User.create({
            email: 'fred@frewd',
            password: 'howyadoin',
            featuredPostPosition: 2,
          })

          // position is automatically set by sortable
          const post1 = await Post.create({ user })
          const rating1 = await Rating.create({ user, rateable: post1 })
          const post2 = await Post.create({ user })
          const rating2 = await Rating.create({ user, rateable: post2 })

          const sanityCheckUser = await User.query().preload('ratings').first()
          expect(sanityCheckUser!.ratings).toMatchDreamModels([rating1, rating2])

          const reloadedUser = await User.query().preload('featuredRatings').first()
          expect(reloadedUser!.featuredRatings).toMatchDreamModels([rating2])
        })

        context('when the whereSelf is declared on the join association', () => {
          it('applies conditional to selectively bring in records', async () => {
            const user = await User.create({
              email: 'fred@frewd',
              password: 'howyadoin',
              targetRating: 7,
            })
            const post1 = await Post.create({ user })
            const rating1a = await Rating.create({ user, rateable: post1, rating: 3 })
            const rating1b = await Rating.create({ user, rateable: post1, rating: 7 })
            const post2 = await Post.create({ user })
            const rating2a = await Rating.create({ user, rateable: post2, rating: 7 })
            const rating2b = await Rating.create({ user, rateable: post2, rating: 5 })

            const reloadedUser = await User.query()
              .preload('ratingsThroughPostsThatMatchUserTargetRating')
              .first()
            expect(reloadedUser!.ratingsThroughPostsThatMatchUserTargetRating).toMatchDreamModels([
              rating1b,
              rating2a,
            ])
          })
        })

        context(
          'when the association with the selfWhere clause is not the starting model in the association chain',
          () => {
            it('loads the associated object', async () => {
              const user = await User.create({
                email: 'fred@frewd',
                password: 'howyadoin',
                featuredPostPosition: 2,
              })

              // position is automatically set by sortable
              const post1 = await Post.create({ user })
              const rating1 = await Rating.create({ user, rateable: post1 })
              const post2 = await Post.create({ user })
              const rating2 = await Rating.create({ user, rateable: post2 })

              const pet = await Pet.create({ user })

              const sanityCheckPet = await Pet.query().preload('ratings').first()
              expect(sanityCheckPet!.ratings).toMatchDreamModels([rating1, rating2])

              const reloadedPet = await Pet.query().preload('featuredPost').preload('featuredRatings').first()
              expect(reloadedPet!.featuredPost).toMatchDreamModel(post2)
              expect(reloadedPet!.featuredRatings).toMatchDreamModels([rating2])
            })
          }
        )
      })
    })
  })

  context('with a where clause on an implicit through association', () => {
    it('applies conditional to selectively bring in records', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })

      const collar1 = await pet.createAssociation('collars', { balloon: redBalloon })
      const collar2 = await pet.createAssociation('collars', { balloon: greenBalloon })

      const reloaded = await Pet.preload('redBalloons').first()
      expect(reloaded!.redBalloons).toMatchDreamModels([redBalloon])
    })
  })

  context('with a whereNot clause on an implicit through association', () => {
    it('applies conditional to selectively bring in records', async () => {
      const pet = await Pet.create()
      const redBalloon = await Latex.create({ color: 'red' })
      const greenBalloon = await Latex.create({ color: 'green' })
      const blueBalloon = await Latex.create({ color: 'blue' })

      const collar1 = await pet.createAssociation('collars', { balloon: redBalloon })
      const collar2 = await pet.createAssociation('collars', { balloon: greenBalloon })
      const collar3 = await pet.createAssociation('collars', { balloon: blueBalloon })

      const reloaded = await Pet.preload('notRedBalloons').first()
      expect(reloaded!.notRedBalloons).toMatchDreamModels([greenBalloon, blueBalloon])
    })
  })

  context('with a missing association', () => {
    it('throws JoinAttemptedOnMissingAssociation', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = User.query().preload('nonExtantCompositionAssets1').first()

      await expect(query).rejects.toThrow(JoinAttemptedOnMissingAssociation)
    })
  })

  context('with a missing source', () => {
    it('throws MissingThroughAssociationSource', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = User.query().preload('nonExtantCompositionAssets2').first()

      await expect(query).rejects.toThrow(MissingThroughAssociationSource)
    })
  })

  context('unscoped', () => {
    it('cascades through associations', async () => {
      const user = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        deletedAt: DateTime.now(),
      })
      const pet = await Pet.create({ user })
      const balloon = await Latex.create({ color: 'red', deletedAt: DateTime.now() })
      const collar = await Collar.create({ pet, balloon })

      const unscopedReloadedUser = await User.unscoped().preload('pets', 'redBalloons').first()
      expect(unscopedReloadedUser).toMatchDreamModel(user)
      expect(unscopedReloadedUser!.pets).toMatchDreamModels([pet])
      expect(unscopedReloadedUser!.pets[0].redBalloons).toMatchDreamModels([balloon])
    })
  })

  context('preloadThroughColumns', () => {
    it('loads the specified columns onto the loaded model', async () => {
      const node = await Node.create({ name: 'mynode' })
      const edge1 = await Edge.create({ name: 'myedge1' })
      const edge2 = await Edge.create({ name: 'myedge2' })

      // position automatically set by Sortable decorator
      const edgeNode1 = await node.createAssociation('edgeNodes', { name: 'graph_edge_1', edge: edge1 })
      const edgeNode2 = await node.createAssociation('edgeNodes', { name: 'graph_edge_2', edge: edge2 })

      const reloadedNode = await Node.preload('edges').first()

      const reloadedEdge1 = reloadedNode!.edges.find(obj => obj.name === 'myedge1')
      const reloadedEdge2 = reloadedNode!.edges.find(obj => obj.name === 'myedge2')

      expect(reloadedEdge1!.preloadedThroughColumns.position).toEqual(1)
      expect(reloadedEdge1!.preloadedThroughColumns.createdAt).toEqualDateTime(edgeNode1.createdAt)

      expect(reloadedEdge2!.preloadedThroughColumns.position).toEqual(2)
      expect(reloadedEdge2!.preloadedThroughColumns.createdAt).toEqualDateTime(edgeNode2.createdAt)
    })
  })
})
