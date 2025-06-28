import MissingThroughAssociation from '../../../../src/errors/associations/MissingThroughAssociation.js'
import MissingThroughAssociationSource from '../../../../src/errors/associations/MissingThroughAssociationSource.js'
import { DateTime } from '../../../../src/index.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import BalloonSpotter from '../../../../test-app/app/models/BalloonSpotter.js'
import BalloonSpotterBalloon from '../../../../test-app/app/models/BalloonSpotterBalloon.js'
import Collar from '../../../../test-app/app/models/Collar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit.js'
import HeartRating from '../../../../test-app/app/models/ExtraRating/HeartRating.js'
import Edge from '../../../../test-app/app/models/Graph/Edge.js'
import EdgeNode from '../../../../test-app/app/models/Graph/EdgeNode.js'
import Node from '../../../../test-app/app/models/Graph/Node.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import Post from '../../../../test-app/app/models/Post.js'
import Rating from '../../../../test-app/app/models/Rating.js'
import User from '../../../../test-app/app/models/User.js'

describe('Query#leftJoinPreload through', () => {
  context('explicit HasMany through a BelongsTo', () => {
    it('sets HasMany property on the model and BelongsToProperty on the associated model', async () => {
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      const balloonSpotterBalloon = await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await BalloonSpotter.query()
        .leftJoinPreload('balloonSpotterBalloons', 'balloon')
        .firstOrFail()
      expect(reloaded.balloonSpotterBalloons).toMatchDreamModels([balloonSpotterBalloon])
      expect(reloaded.balloonSpotterBalloons[0]!.balloon).toMatchDreamModel(balloon)
    })

    it('supports and-clauses', async () => {
      const balloon = await Latex.create()
      const balloon2 = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      await BalloonSpotterBalloon.create({ balloonSpotter, balloon })
      const balloonSpotterBalloon2 = await BalloonSpotterBalloon.create({ balloonSpotter, balloon: balloon2 })

      const reloaded = await BalloonSpotter.query()
        .leftJoinPreload('balloonSpotterBalloons', { and: { id: balloonSpotterBalloon2.id } }, 'balloon')
        .firstOrFail()
      expect(reloaded.balloonSpotterBalloons).toMatchDreamModels([balloonSpotterBalloon2])
      expect(reloaded.balloonSpotterBalloons[0]!.balloon).toMatchDreamModel(balloon2)
    })

    context('supports andNot-clauses', () => {
      it('negates the logic of all the clauses ANDed together', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        await Latex.create({ user, color: 'red' })
        const redMylarBalloon = await Mylar.create({ user, color: 'red' })
        const greenLatexBalloon = await Latex.create({ user, color: 'green' })

        const reloaded = await User.leftJoinPreload('balloons', {
          andNot: { color: 'red', type: 'Latex' },
        }).firstOrFail()
        expect(reloaded.balloons).toMatchDreamModels([redMylarBalloon, greenLatexBalloon])
      })
    })

    it('supports where clauses farther in', async () => {
      const balloon = await Latex.create({ color: 'red' })
      const balloonSpotter = await BalloonSpotter.create()
      const balloonSpotterBalloon = await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await BalloonSpotter.query()
        .leftJoinPreload('balloonSpotterBalloons', { and: { id: balloonSpotterBalloon.id } }, 'balloon', {
          and: { color: 'red' },
        })
        .firstOrFail()
      expect(reloaded.balloonSpotterBalloons[0]!.balloon).toMatchDreamModel(balloon)

      const reloaded2 = await BalloonSpotter.query()
        .leftJoinPreload('balloonSpotterBalloons', 'balloon', { and: { color: 'blue' } })
        .firstOrFail()
      expect(reloaded2.balloonSpotterBalloons[0]!.balloon).toBeNull()
    })
  })

  context('implicit HasMany through a BelongsTo', () => {
    it('sets HasMany property', async () => {
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

      const reloaded = await BalloonSpotter.query().leftJoinPreload('balloons').firstOrFail()
      expect(reloaded.balloons).toMatchDreamModels([balloon])
    })

    it('supports where clauses', async () => {
      const blueBalloon = await Latex.create({ color: 'blue' })
      const redBalloon = await Latex.create({ color: 'red' })
      const balloonSpotter = await BalloonSpotter.create()
      await BalloonSpotterBalloon.create({ balloonSpotter, balloon: blueBalloon })
      await BalloonSpotterBalloon.create({ balloonSpotter, balloon: redBalloon })

      const reloaded = await BalloonSpotter.query()
        .leftJoinPreload('balloons', { and: { color: 'red' } })
        .firstOrFail()
      expect(reloaded.balloons).toMatchDreamModels([redBalloon])
    })

    context('when the join model does not have an associated BelongsTo', () => {
      it('returns an array without null values', async () => {
        const balloon = await Latex.create()
        const balloonSpotter = await BalloonSpotter.create()
        await BalloonSpotterBalloon.create({ balloonSpotter, balloon })

        const reloaded = await BalloonSpotter.query().leftJoinPreload('users').firstOrFail()
        expect(reloaded.users).toEqual([])
      })
    })
  })

  context('combined explicit and implicit on the same HasMany through', () => {
    it('sets HasMany property on the model and BelongsToProperty on the associated model', async () => {
      const balloon = await Latex.create()
      const balloonSpotter = await BalloonSpotter.create()
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const balloonSpotterBalloon = await BalloonSpotterBalloon.create({ balloonSpotter, balloon, user })

      const reloaded = await BalloonSpotter.query().leftJoinPreload('balloons').firstOrFail()
      expect(reloaded.balloons).toMatchDreamModels([balloon])

      const reloaded2 = await BalloonSpotter.query()
        .leftJoinPreload('balloonSpotterBalloons', 'user')
        .firstOrFail()
      expect(reloaded2.balloonSpotterBalloons).toMatchDreamModels([balloonSpotterBalloon])
      expect(reloaded2.balloonSpotterBalloons[0]!.user).toMatchDreamModel(user)
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

      const reloadedUser = await User.query().leftJoinPreload('mainCompositionAsset').firstOrFail()
      expect(reloadedUser.mainCompositionAsset).toMatchDreamModel(compositionAsset)
    })

    context('when there is no associated model', () => {
      it('sets the association property and the join association property to null', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = await User.query().leftJoinPreload('mainCompositionAsset').firstOrFail()
        expect(reloadedUser.mainCompositionAsset).toBeNull()
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
        .leftJoinPreload('mainCompositionAsset', 'compositionAssetAudits')
        .firstOrFail()
      expect(reloadedComposition.mainCompositionAsset).toMatchDreamModel(compositionAsset)
      expect(reloadedComposition.mainCompositionAsset.compositionAssetAudits).toMatchDreamModels([
        compositionAssetAudit,
      ])
    })

    context('when the join model does not have an associated HasOne', () => {
      it('returns an array without null values', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Latex.create({ user })
        const reloaded = await User.leftJoinPreload('balloonLines').firstOrFail()
        expect(reloaded.balloonLines).toEqual([])
      })
    })

    context('multiple, final associations', () => {
      it('loads all of the specified associations', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user, primary: true })
        const compositionAsset = await CompositionAsset.create({ composition })
        const compositionAsset2 = await CompositionAsset.create({ composition })
        const heartRating = await HeartRating.create({
          user,
          extraRateable: composition,
        })

        const reloaded = await User.query()
          .leftJoinPreload('mainComposition', ['compositionAssets', 'heartRatings'])
          .firstOrFail()
        expect(reloaded.mainComposition).toMatchDreamModel(composition)
        expect(reloaded.mainComposition.compositionAssets).toMatchDreamModels([
          compositionAsset,
          compositionAsset2,
        ])
        expect(reloaded.mainComposition.heartRatings).toMatchDreamModels([heartRating])
      })
    })

    context('when there are no models associated via the HasMany', () => {
      it('sets HasMany association to an empty array', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        await CompositionAsset.create({
          composition,
          primary: true,
        })

        const reloadedComposition = await Composition.query()
          .leftJoinPreload('mainCompositionAsset', 'compositionAssetAudits')
          .firstOrFail()
        expect(reloadedComposition.mainCompositionAsset.compositionAssetAudits).toEqual([])
      })
    })

    context('when the join model doesn’t exist', () => {
      it('sets HasOne association property on the base model to null', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({ user })

        const reloadedComposition = await Composition.query()
          .leftJoinPreload('mainCompositionAsset', 'compositionAssetAudits')
          .firstOrFail()
        expect(reloadedComposition.mainCompositionAsset).toBeNull()
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

      const reloadedComposition = await Composition.query()
        .leftJoinPreload('mainCompositionAssetAudits')
        .firstOrFail()
      expect(reloadedComposition.mainCompositionAssetAudits).toMatchDreamModels([compositionAssetAudit])
    })

    context('when there are no models associated via the HasMany', () => {
      it('sets the HasMany association to an empty array', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })
        await CompositionAsset.create({
          composition,
          primary: true,
        })

        const reloadedComposition = await Composition.query()
          .leftJoinPreload('mainCompositionAssetAudits')
          .firstOrFail()
        expect(reloadedComposition.mainCompositionAssetAudits).toEqual([])
      })
    })
  })

  context('with NON-matching where-clause-on-the-association', () => {
    it('sets the association to null', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })
      await CompositionAsset.create({ composition })
      await CompositionAsset.create({
        composition,
        primary: false,
      })

      const reloadedUser = await User.query().leftJoinPreload('mainCompositionAsset').firstOrFail()
      expect(reloadedUser.mainCompositionAsset).toBeNull()
    })
  })

  it('loads a HasOne through BelongsTo association', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    await CompositionAsset.create({ composition })

    const reloadedCompositionAsset = await CompositionAsset.query().leftJoinPreload('user').firstOrFail()
    expect(reloadedCompositionAsset.user).toMatchDreamModel(user)
  })

  context('HasMany through HasMany association', () => {
    it('loads the included association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })
      const compositionAsset = await CompositionAsset.create({ composition })

      const reloadedUser = await User.query().leftJoinPreload('compositionAssets').firstOrFail()
      expect(reloadedUser.compositionAssets).toMatchDreamModels([compositionAsset])
    })

    context('when there are no associated models', () => {
      it('sets the association to an empty array', async () => {
        await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const users = await User.query().leftJoinPreload('compositionAssets').all()
        expect(users[0]!.compositionAssets).toEqual([])
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

      const reloadedUser = await User.query().leftJoinPreload('compositionAssetAudits').firstOrFail()
      expect(reloadedUser.compositionAssetAudits).toMatchDreamModels([compositionAssetAudit])
    })

    it('loads a HasOne through a HasOne through a BelongsTo', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({ composition })
      await CompositionAssetAudit.create({
        compositionAssetId: compositionAsset.id,
      })

      const reloaded = await CompositionAssetAudit.query().leftJoinPreload('user').firstOrFail()
      expect(reloaded.user).toMatchDreamModel(user)
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
        await CompositionAsset.create({ composition: olderComposition })

        const reloadedUser = await User.query()
          .leftJoinPreload('recentCompositions', 'compositionAssets')
          .firstOrFail()
        expect(reloadedUser.recentCompositions[0]!.compositionAssets).toMatchDreamModels([compositionAsset1])
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
        await CompositionAsset.create({ composition: olderComposition })

        const reloadedUser = await User.query().leftJoinPreload('recentCompositionAssets').firstOrFail()
        expect(reloadedUser).toMatchDreamModel(user)
        expect(reloadedUser.recentCompositionAssets).toMatchDreamModels([compositionAsset1])
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
          await CompositionAsset.create({
            composition: olderComposition,
            primary: true,
          })

          const reloadedUser = await User.query().leftJoinPreload('recentCompositionAssets').firstOrFail()
          expect(reloadedUser).toMatchDreamModel(user)
          expect(reloadedUser.recentCompositionAssets).toMatchDreamModels([compositionAsset1])
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

          const sanityCheckUser = await User.query().leftJoinPreload('ratings').firstOrFail()
          expect(sanityCheckUser.ratings).toMatchDreamModels([rating1, rating2])

          const reloadedUser = await User.query().leftJoinPreload('featuredRatings').firstOrFail()
          expect(reloadedUser.featuredRatings).toMatchDreamModels([rating2])
        })

        context('when the selfWhere is declared on the join association', () => {
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

            const reloadedUser = await User.query()
              .leftJoinPreload('ratingsThroughPostsThatMatchUserTargetRating')
              .firstOrFail()
            expect(reloadedUser.ratingsThroughPostsThatMatchUserTargetRating).toMatchDreamModels([
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

              await Pet.create({ user })

              const sanityCheckPet = await Pet.query().leftJoinPreload('ratings').firstOrFail()
              expect(sanityCheckPet.ratings).toMatchDreamModels([rating1, rating2])

              const reloadedPet = await Pet.query().leftJoinPreload('featuredPost').firstOrFail()
              expect(reloadedPet.featuredPost).toMatchDreamModel(post2)

              const reloadedPet2 = await Pet.query().leftJoinPreload('featuredRatings').firstOrFail()
              expect(reloadedPet2.featuredRatings).toMatchDreamModels([rating2])
            })
          }
        )

        context('through a BelongsTo', () => {
          it('applies conditional to selectively bring in records', async () => {
            const node = await Node.create({ name: 'world', omittedEdgePosition: 1 })
            const edge1 = await Edge.create({ name: 'hello' })
            const edge2 = await Edge.create({ name: 'world' })
            const edge3 = await Edge.create({ name: 'goodbye' })

            // position is automatically set by sortable
            const edgeNode1 = await EdgeNode.create({ node, edge: edge1 })
            const edgeNode2 = await EdgeNode.create({ node, edge: edge2 })
            const edgeNode3 = await EdgeNode.create({ node, edge: edge3 })

            const sanityCheckEdgeNode = await edgeNode2.leftJoinLoad('siblingsIncludingMe').execute()
            expect(sanityCheckEdgeNode.siblingsIncludingMe).toMatchDreamModels([
              edgeNode1,
              edgeNode2,
              edgeNode3,
            ])

            const reloadedEdgeNode = await edgeNode2.leftJoinLoad('justThisSibling').execute()
            expect(reloadedEdgeNode).toMatchDreamModel(edgeNode2)
            expect(reloadedEdgeNode.justThisSibling).toMatchDreamModel(edgeNode2)
          })
        })
      })

      context('with selfWhereNot clause', () => {
        let node: Node
        let edge1: Edge
        let edge2: Edge
        let edge3: Edge
        let edgeNode1: EdgeNode
        let edgeNode2: EdgeNode
        let edgeNode3: EdgeNode

        beforeEach(async () => {
          node = await Node.create({ name: 'world', omittedEdgePosition: 1 })
          edge1 = await Edge.create({ name: 'hello' })
          edge2 = await Edge.create({ name: 'world' })
          edge3 = await Edge.create({ name: 'goodbye' })

          // position is automatically set by sortable
          edgeNode1 = await EdgeNode.create({ node, edge: edge1 })
          edgeNode2 = await EdgeNode.create({ node, edge: edge2 })
          edgeNode3 = await EdgeNode.create({ node, edge: edge3 })
        })

        it('loads the associated models', async () => {
          const sanityCheckNode = await Node.query().leftJoinPreload('edges').firstOrFail()
          expect(sanityCheckNode.edges).toMatchDreamModels([edge1, edge2, edge3])

          const reloadedNode = await Node.query().leftJoinPreload('nonOmittedPositionEdges').firstOrFail()
          expect(reloadedNode.nonOmittedPositionEdges).toMatchDreamModels([edge2, edge3])
        })

        context('when the selfWhere is declared on the join association', () => {
          it('applies conditional to selectively bring in records', async () => {
            const sanityCheckNode = await Node.query().leftJoinPreload('edges').firstOrFail()
            expect(sanityCheckNode.edges).toMatchDreamModels([edge1, edge2, edge3])

            const reloadedNode = await Node.query()
              .leftJoinPreload('nonNodeNameEdgesOnThroughAssociation')
              .firstOrFail()
            expect(reloadedNode.nonNodeNameEdgesOnThroughAssociation).toMatchDreamModels([edge1, edge3])
          })
        })

        context('through a BelongsTo', () => {
          it('applies conditional to selectively bring in records', async () => {
            const sanityCheckEdgeNode = await edgeNode2.leftJoinLoad('siblingsIncludingMe').execute()
            expect(sanityCheckEdgeNode.siblingsIncludingMe).toMatchDreamModels([
              edgeNode1,
              edgeNode2,
              edgeNode3,
            ])

            const reloadedEdgeNode = await edgeNode2.leftJoinLoad('siblings').execute()
            expect(reloadedEdgeNode.siblings).toMatchDreamModels([edgeNode1, edgeNode3])
          })
        })
      })
    })

    context('through a BelongsTo', () => {
      it('applies conditional to selectively bring in records', async () => {
        const node = await Node.create({ name: 'world', omittedEdgePosition: 1 })
        const edge1 = await Edge.create({ name: 'hello' })
        const edge2 = await Edge.create({ name: 'world' })
        const edge3 = await Edge.create({ name: 'goodbye' })

        // position is automatically set by sortable
        const edgeNode1 = await EdgeNode.create({ node, edge: edge1 })
        const edgeNode2 = await EdgeNode.create({ node, edge: edge2 })
        await EdgeNode.create({ node, edge: edge3 })

        const reloadedEdgeNode = await edgeNode2.leftJoinLoad('headSibling').execute()
        expect(reloadedEdgeNode.headSibling).toMatchDreamModel(edgeNode1)
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

      const reloaded = await Pet.leftJoinPreload('and_red').firstOrFail()
      expect(reloaded.and_red).toMatchDreamModels([redBalloon])
    })

    context('when no association matches the where clause', () => {
      it('still finds the base model', async () => {
        const pet = await Pet.create()
        const greenBalloon = await Latex.create({ color: 'green' })

        await pet.createAssociation('collars', { balloon: greenBalloon })

        const reloaded = await Pet.leftJoinPreload('and_red').firstOrFail()
        expect(reloaded.and_red).toEqual([])
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

      const reloaded = await Pet.leftJoinPreload('andNot_red').firstOrFail()
      expect(reloaded.andNot_red).toMatchDreamModels([greenBalloon, blueBalloon])
    })

    context('through a BelongsTo', () => {
      it('applies conditional to selectively bring in records', async () => {
        const node = await Node.create({ name: 'world', omittedEdgePosition: 1 })
        const edge1 = await Edge.create({ name: 'hello' })
        const edge2 = await Edge.create({ name: 'world' })
        const edge3 = await Edge.create({ name: 'goodbye' })

        // position is automatically set by sortable
        await EdgeNode.create({ node, edge: edge1 })
        const edgeNode2 = await EdgeNode.create({ node, edge: edge2 })
        const edgeNode3 = await EdgeNode.create({ node, edge: edge3 })

        const reloadedEdgeNode = await edgeNode2.leftJoinLoad('tailSiblings').execute()
        expect(reloadedEdgeNode.tailSiblings).toMatchDreamModels([edgeNode2, edgeNode3])
      })
    })
  })

  context('with a missing association', () => {
    it('throws MissingThroughAssociation', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = User.query().leftJoinPreload('nonExtantCompositionAssets1').firstOrFail()

      await expect(query).rejects.toThrow(MissingThroughAssociation)
    })
  })

  context('with a missing source', () => {
    it('throws MissingThroughAssociationSource', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const query = User.query().leftJoinPreload('nonExtantCompositionAssets2').firstOrFail()

      await expect(query).rejects.toThrow(MissingThroughAssociationSource)
    })
  })

  context('removeAllDefaultScopes', () => {
    it('cascades through associations', async () => {
      const user = await User.create({
        email: 'fred@frewd',
        password: 'howyadoin',
        deletedAt: DateTime.now(),
      })
      const pet = await Pet.create({ user })
      const balloon = await Latex.create({ color: 'red', deletedAt: DateTime.now() })
      await Collar.create({ pet, balloon })

      const unscopedReloadedUser = await User.removeAllDefaultScopes()
        .leftJoinPreload('pets', 'and_red')
        .firstOrFail()
      expect(unscopedReloadedUser).toMatchDreamModel(user)
      expect(unscopedReloadedUser.pets).toMatchDreamModels([pet])
      expect(unscopedReloadedUser.pets[0]!.and_red).toMatchDreamModels([balloon])
    })
  })

  context('leftJoinPreloadThroughColumns', () => {
    it.skip('loads the specified columns onto the loaded model', async () => {
      const node = await Node.create({ name: 'mynode' })
      const edge1 = await Edge.create({ name: 'myedge1' })
      const edge2 = await Edge.create({ name: 'myedge2' })

      // position automatically set by Sortable decorator
      const edgeNode1 = await node.createAssociation('edgeNodes', { edge: edge1 })
      const edgeNode2 = await node.createAssociation('edgeNodes', { edge: edge2 })

      const reloadedNode = await Node.leftJoinPreload('edges').firstOrFail()

      const reloadedEdge1 = reloadedNode.edges.find(obj => obj.name === 'myedge1')
      const reloadedEdge2 = reloadedNode.edges.find(obj => obj.name === 'myedge2')

      expect(reloadedEdge1!.preloadedThroughColumns.position).toEqual(1)
      expect(reloadedEdge1!.preloadedThroughColumns.createdAt).toEqualDateTime(edgeNode1.createdAt)

      expect(reloadedEdge2!.preloadedThroughColumns.position).toEqual(2)
      expect(reloadedEdge2!.preloadedThroughColumns.createdAt).toEqualDateTime(edgeNode2.createdAt)
    })

    context('with aliased set values', () => {
      it.skip('loads the specified columns onto the loaded model', async () => {
        const node = await Node.create({ name: 'mynode' })
        const edge1 = await Edge.create({ name: 'myedge1' })
        const edge2 = await Edge.create({ name: 'myedge2' })

        // position automatically set by Sortable decorator
        const edgeNode1 = await node.createAssociation('edgeNodes', { edge: edge1 })
        const edgeNode2 = await node.createAssociation('edgeNodes', { edge: edge2 })

        const reloadedNode = await Node.leftJoinPreload('edgesWithAliasedPreloads').firstOrFail()

        const reloadedEdge1 = reloadedNode.edgesWithAliasedPreloads.find(obj => obj.name === 'myedge1')
        const reloadedEdge2 = reloadedNode.edgesWithAliasedPreloads.find(obj => obj.name === 'myedge2')

        expect(reloadedEdge1!.preloadedThroughColumns.aliasedPosition).toEqual(1)
        expect(reloadedEdge1!.preloadedThroughColumns.aliasedCreatedAt).toEqualDateTime(edgeNode1.createdAt)

        expect(reloadedEdge2!.preloadedThroughColumns.aliasedPosition).toEqual(2)
        expect(reloadedEdge2!.preloadedThroughColumns.aliasedCreatedAt).toEqualDateTime(edgeNode2.createdAt)
      })
    })
  })

  context('with order-clause-on-the-association', () => {
    let node: Node
    let edge1: Edge
    let edge2: Edge
    let edge3: Edge
    let edgeNode1: EdgeNode
    let edgeNode2: EdgeNode
    let edgeNode3: EdgeNode

    beforeEach(async () => {
      node = await Node.create({ name: 'world', omittedEdgePosition: 1 })
      edge1 = await Edge.create({ name: 'c' })
      edge2 = await Edge.create({ name: 'a' })
      edge3 = await Edge.create({ name: 'b' })

      // position is automatically set by sortable
      edgeNode1 = await EdgeNode.create({ node, edge: edge1 })
      edgeNode2 = await EdgeNode.create({ node, edge: edge2 })
      edgeNode3 = await EdgeNode.create({ node, edge: edge3 })
      await edgeNode3.update({ position: 1 })
    })

    it('orders the results based on the order specified in the association', async () => {
      const node = await Node.leftJoinPreload('edgesOrderedByName').firstOrFail()
      expect(node.edgesOrderedByName[0]).toMatchDreamModel(edge2)
      expect(node.edgesOrderedByName[1]).toMatchDreamModel(edge3)
      expect(node.edgesOrderedByName[2]).toMatchDreamModel(edge1)
    })

    context('order on the association we’re going through', () => {
      it('orders the results based on the order specified in the association', async () => {
        const node = await Node.leftJoinPreload('edgesOrderedByPosition').firstOrFail()
        expect(node.edgesOrderedByPosition[0]).toMatchDreamModel(edge3)
        expect(node.edgesOrderedByPosition[1]).toMatchDreamModel(edge1)
        expect(node.edgesOrderedByPosition[2]).toMatchDreamModel(edge2)
      })
    })

    context('through a BelongsTo association', () => {
      it('orders the results based on the order specified in the root association', async () => {
        const node = await edgeNode2.leftJoinLoad('orderedSiblings').execute()
        expect(node.orderedSiblings[0]).toMatchDreamModel(edgeNode3)
        expect(node.orderedSiblings[1]).toMatchDreamModel(edgeNode1)
        expect(node.orderedSiblings[2]).toMatchDreamModel(edgeNode2)
      })

      it('orders the results based on the order specified in the source association', async () => {
        const node = await edgeNode2.leftJoinLoad('orderedSiblingsWithOrderOnSource').execute()
        expect(node.orderedSiblingsWithOrderOnSource[0]).toMatchDreamModel(edgeNode3)
        expect(node.orderedSiblingsWithOrderOnSource[1]).toMatchDreamModel(edgeNode1)
        expect(node.orderedSiblingsWithOrderOnSource[2]).toMatchDreamModel(edgeNode2)
      })
    })
  })

  it('it adds explicitly joined Dream classes to innerJoinDreamClasses', () => {
    const query = BalloonSpotter.query().leftJoinPreload('balloonSpotterBalloons', 'balloon')
    expect(query['innerJoinDreamClasses']).toEqual([BalloonSpotterBalloon, Balloon])
  })

  it('it adds implicitly joined Dream classes to innerJoinDreamClasses', () => {
    const query = BalloonSpotter.query().leftJoinPreload('balloons')
    expect(query['innerJoinDreamClasses']).toEqual([BalloonSpotterBalloon, Balloon])
  })

  it('applies default scopes when joining on a through association', async () => {
    const node = await Node.create()
    const edge = await Edge.create()
    const edgeNode = await EdgeNode.create({ edge, node })

    const reloaded = await Node.query().leftJoinPreload('edges').firstOrFail()
    expect(reloaded.edges).toMatchDreamModels([edge])

    await edgeNode.update({ deletedAt: DateTime.now() })

    const reloadedAfterSoftdelete = await Node.query().leftJoinPreload('edges').firstOrFail()
    expect(reloadedAfterSoftdelete.edges).toEqual([])
  })
})
