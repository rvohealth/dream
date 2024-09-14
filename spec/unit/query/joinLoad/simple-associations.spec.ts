import { DateTime } from 'luxon'
import Balloon from '../../../../test-app/app/models/Balloon'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import BalloonLine from '../../../../test-app/app/models/BalloonLine'
import Collar from '../../../../test-app/app/models/Collar'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import Edge from '../../../../test-app/app/models/Graph/Edge'
import EdgeNode from '../../../../test-app/app/models/Graph/EdgeNode'
import Node from '../../../../test-app/app/models/Graph/Node'
import LocalizedText from '../../../../test-app/app/models/LocalizedText'
import Pet from '../../../../test-app/app/models/Pet'
import Post from '../../../../test-app/app/models/Post'
import PostComment from '../../../../test-app/app/models/PostComment'
import User from '../../../../test-app/app/models/User'

describe('Query#joinLoad with simple associations', () => {
  context('HasOne', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id, primary: true })

      const reloadedUser = await User.query().joinLoad('mainComposition').first()
      expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
    })

    it('supports where clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id, primary: true, content: 'Hello' })

      const reloadedUser = await User.query().joinLoad('mainComposition', { content: 'Goodbye' }).first()
      expect(reloadedUser?.mainComposition).toBeNull()

      const reloadedUser2 = await User.query().joinLoad('mainComposition', { content: 'Hello' }).first()
      expect(reloadedUser2!.mainComposition).toMatchDreamModel(composition)
    })

    context('when the association does not exist', () => {
      it('sets it to null', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = await User.query().joinLoad('mainComposition').first()
        expect(reloadedUser!.mainComposition).toBeNull()
      })
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const balloon = await Latex.create({ color: 'blue' })
        const line = await BalloonLine.create({ balloon, material: 'ribbon' })

        const reloaded = await Balloon.query().joinLoad('balloonLine').first()
        expect(reloaded!.balloonLine).toMatchDreamModel(line)
      })
    })
  })

  context('HasMany', () => {
    it('loads the associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition1 = await Composition.create({ user })
      const composition2 = await Composition.create({ user })

      const reloadedUser = await User.query().joinLoad('compositions').first()
      expect(reloadedUser!.compositions).toMatchDreamModels([composition1, composition2])
    })

    it('supports where clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user, content: 'Hello' })
      const composition2 = await Composition.create({ user, content: 'Goodbye' })

      const reloadedUser = await User.query().joinLoad('compositions', { content: 'Goodbye' }).first()
      expect(reloadedUser!.compositions).toMatchDreamModels([composition2])
    })

    context('when no association exists', () => {
      it('sets it to an empty array', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = await User.query().joinLoad('compositions').first()
        expect(reloadedUser!.compositions).toEqual([])
      })
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const balloon = await Latex.create({ user, color: 'blue' })

        const reloadedUser = await User.query().joinLoad('balloons').first()
        expect(reloadedUser!.balloons).toMatchDreamModels([balloon])
      })
    })
  })

  context('when there are HasMany results', () => {
    it('sets the association to an empty array', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const reloadedUser = await User.query().joinLoad('compositions').first()
      expect(reloadedUser!.compositions).toEqual([])
    })
  })

  context('BelongsTo', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user })
      const reloadedComposition = await Composition.query().joinLoad('user').first()
      expect(reloadedComposition!.user).toMatchDreamModel(user)
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const balloon = await Latex.create({ color: 'blue' })
        await BalloonLine.create({ balloon, material: 'ribbon' })

        const reloaded = await BalloonLine.query().joinLoad('balloon').first()
        expect(reloaded!.balloon).toMatchDreamModel(balloon)
      })
    })

    context('withoutDefaultScopes', () => {
      it('removes the default scope when applying the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'password' })
        const post = await Post.create({ user })
        const postComment = await PostComment.create({ post })

        await post.destroy()

        const reloadedPostComment = await postComment.load('post').execute()
        expect(reloadedPostComment.post).toBeNull()
        const reloadedPostComment2 = await postComment.load('postEvenIfDeleted').execute()
        expect(reloadedPostComment2.postEvenIfDeleted).toMatchDreamModel(post)
      })
    })
  })

  it('can handle object notation', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

    const reloaded = await User.query().joinLoad('compositions', 'compositionAssets').first()
    expect(reloaded!.compositions).toMatchDreamModels([composition])
    expect(reloaded!.compositions[0].compositionAssets).toMatchDreamModels([compositionAsset])
  })

  it('can handle sibling joinLoad', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, primary: true })
    const composition2 = await Composition.create({ user })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

    const reloadedUser = await User.query()
      .joinLoad('compositions')
      .joinLoad('mainComposition', 'compositionAssets')
      .first()

    expect(reloadedUser!.compositions).toMatchDreamModels([composition, composition2])
    expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
    expect(reloadedUser!.mainComposition.compositionAssets).toMatchDreamModels([compositionAsset])
  })

  context('HasMany', () => {
    context('with matching where-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({
          user,
          createdAt: DateTime.now().minus({ day: 1 }),
        })

        const reloadedUser = await User.query().joinLoad('recentCompositions').first()
        expect(reloadedUser!.recentCompositions).toMatchDreamModels([composition])
      })

      context('with "passthrough"', () => {
        it('loads the associated object', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

          const composition = await Composition.create({ user })
          await LocalizedText.create({ localizable: composition, locale: 'en-US' })
          const compositionText2 = await LocalizedText.create({ localizable: composition, locale: 'es-ES' })

          const compositionAsset = await CompositionAsset.create({ composition })
          const compositionAssetText1 = await LocalizedText.create({
            localizable: compositionAsset,
            locale: 'es-ES',
          })
          await LocalizedText.create({
            localizable: compositionAsset,
            locale: 'en-US',
          })

          const reloadedUser = await User.query()
            .passthrough({ locale: 'es-ES' })
            .joinLoad('compositions', 'currentLocalizedText')
            .joinLoad('compositions', 'compositionAssets', 'currentLocalizedText')
            .first()
          expect(reloadedUser!.compositions[0].currentLocalizedText).toMatchDreamModel(compositionText2)
          expect(reloadedUser!.compositions[0].compositionAssets[0].currentLocalizedText).toMatchDreamModel(
            compositionAssetText1
          )
        })
      })
    })

    context('with NON-matching where-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const reloadedUser = await User.query().joinLoad('recentCompositions').first()
        expect(reloadedUser!.recentCompositions).toEqual([])
      })
    })

    context('with selfWhere clause', () => {
      it('loads the associated object', async () => {
        const user = await User.create({
          email: 'fred@frewd',
          password: 'howyadoin',
          featuredPostPosition: 2,
        })

        // position is automatically set by sortable
        await Post.create({ user })
        const post2 = await Post.create({ user })

        const reloadedUser = await User.query().joinLoad('featuredPost').first()
        expect(reloadedUser!.featuredPost).toMatchDreamModel(post2)
      })
    })

    context('with selfWhereNot clause', () => {
      let node: Node
      let edge1: Edge
      let edge2: Edge
      let edge3: Edge
      let edgeNode2: EdgeNode
      let edgeNode3: EdgeNode

      beforeEach(async () => {
        node = await Node.create({ name: 'world', omittedEdgePosition: 1 })
        edge1 = await Edge.create({ name: 'hello' })
        edge2 = await Edge.create({ name: 'world' })
        edge3 = await Edge.create({ name: 'goodbye' })

        // position is automatically set by sortable
        await EdgeNode.create({ node, edge: edge1 })
        edgeNode2 = await EdgeNode.create({ node, edge: edge2 })
        edgeNode3 = await EdgeNode.create({ node, edge: edge3 })
      })

      it('loads the associated models', async () => {
        const sanityCheckNode = await Node.query().joinLoad('edges').first()
        expect(sanityCheckNode!.edges).toMatchDreamModels([edge1, edge2, edge3])

        const reloadedNode = await Node.query().joinLoad('nonOmittedPositionEdgeNodes').first()
        expect(reloadedNode!.nonOmittedPositionEdgeNodes).toMatchDreamModels([edgeNode2, edgeNode3])
      })
    })

    context('with matching whereNot-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          createdAt: DateTime.now().minus({ day: 1 }),
        })

        const reloadedUser = await User.query().joinLoad('notRecentCompositions').first()
        expect(reloadedUser!.notRecentCompositions).toEqual([])
      })
    })

    context('with NON-matching whereNot-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const reloadedUser = await User.query().joinLoad('notRecentCompositions').first()
        expect(reloadedUser!.notRecentCompositions).toMatchDreamModels([composition])
      })
    })
  })

  context('HasOne', () => {
    context('with matching where-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })
        const currentCollar = await pet.createAssociation('collars', {
          lost: false,
        })

        const reloaded = await Pet.joinLoad('currentCollar').first()
        expect(reloaded?.currentCollar).toMatchDreamModel(currentCollar)
      })
    })

    context('with NON-matching where-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.joinLoad('currentCollar').first()
        expect(reloaded?.currentCollar).toBeNull()
      })
    })

    context('with matching whereNot-clause-on-the-association', () => {
      it('does not load the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.joinLoad('notLostCollar').first()
        expect(reloaded?.notLostCollar).toBeNull()
      })
    })

    context('with NON-matching whereNot-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const pet = await Pet.create()
        const notLostCollar = await pet.createAssociation('collars', {
          lost: false,
        })

        const reloaded = await Pet.joinLoad('notLostCollar').first()
        expect(reloaded?.notLostCollar).toMatchDreamModel(notLostCollar)
      })
    })

    context('with order-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const firstComposition = await Composition.create({
          user,
        })
        const lastComposition = await Composition.create({
          user,
        })

        const reloadedUser = await User.joinLoad('firstComposition').joinLoad('lastComposition').first()
        expect(reloadedUser!.firstComposition).toMatchDreamModel(firstComposition)
        expect(reloadedUser!.lastComposition).toMatchDreamModel(lastComposition)
      })
    })
  })

  context('with default scopes on the joinLoaded models', () => {
    context('joinLoading a HasMany', () => {
      it('applies default scopes when joining', async () => {
        const pet = await Pet.create({ name: 'aster' })
        await pet.createAssociation('collars', { tagName: 'Aster', pet, hidden: true })

        const result = await Pet.joinLoad('collars').first()
        expect(result!.collars).toHaveLength(0)
      })
    })

    context('joinLoading a BelongsTo', () => {
      it.only('applies default scopes when joining', async () => {
        const pet = await Pet.create({ name: 'aster', deletedAt: DateTime.now() })
        await pet.createAssociation('collars', { tagName: 'Aster', pet })

        const result = await Collar.joinLoad('pet').first()
        expect(result!.pet).toBeNull()
      })
    })
  })

  it.skip('type test', async () => {
    // joinLoad allows re-using of association names since joinLoading does not occur within a single
    // query, so will not result in namespace collision
    await Edge.joinLoad('nodes', 'edges', 'nodes').all()
  })
})
