import { DateTime } from '../../../../src/index.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import BalloonLine from '../../../../test-app/app/models/BalloonLine.js'
import Collar from '../../../../test-app/app/models/Collar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset.js'
import Edge from '../../../../test-app/app/models/Graph/Edge.js'
import EdgeNode from '../../../../test-app/app/models/Graph/EdgeNode.js'
import Node from '../../../../test-app/app/models/Graph/Node.js'
import LocalizedText from '../../../../test-app/app/models/LocalizedText.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import Post from '../../../../test-app/app/models/Post.js'
import PostComment from '../../../../test-app/app/models/PostComment.js'
import User from '../../../../test-app/app/models/User.js'

describe('Query#preload with simple associations', () => {
  context('multiple associations', () => {
    let user: User
    let composition: Composition
    let balloon: Balloon

    beforeEach(async () => {
      user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      composition = await Composition.create({ userId: user.id, primary: true })
      balloon = await Latex.create({ user, color: 'blue' })
    })

    it('can be loaded via the array syntax', async () => {
      const reloaded = await User.query().preload(['balloons', 'compositions']).firstOrFail()
      expect(reloaded.balloons).toMatchDreamModels([balloon])
      expect(reloaded.compositions).toMatchDreamModels([composition])
    })

    it('can be loaded via subsequent preload queries', async () => {
      const reloaded = await User.query().preload('balloons').preload('compositions').firstOrFail()
      expect(reloaded.balloons).toMatchDreamModels([balloon])
      expect(reloaded.compositions).toMatchDreamModels([composition])
    })
  })

  it('aliases can be used to shorten the alias used in the query', async () => {
    const pet = await Pet.create({ name: 'Snoopy' })
    const collar = await Collar.create({ pet, tagName: 'hello' })

    const reloaded = await Pet.query()
      .preload('associationWithVeryLongNameAbcdefghijklmnopqrstuvwxyz as a1')
      .firstOrFail()
    expect(reloaded.associationWithVeryLongNameAbcdefghijklmnopqrstuvwxyz).toMatchDreamModels([collar])
    expect(reloaded.associationWithVeryLongNameAbcdefghijklmnopqrstuvwxyz[0]!.tagName).toEqual('hello')
  })

  context('HasOne', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id, primary: true })

      const reloadedUser = await User.query().preload('mainComposition').first()
      expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
    })

    it('supports and-clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id, content: 'Hello' })

      const reloadedUser = await User.query()
        .preload('compositions', { and: { content: 'Goodbye' } })
        .firstOrFail()
      expect(reloadedUser.compositions).toEqual([])

      const reloadedUser2 = await User.query()
        .preload('compositions', { and: { content: 'Hello' } })
        .firstOrFail()
      expect(reloadedUser2.compositions).toMatchDreamModels([composition])
    })

    it('supports andNot clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id, content: 'Hello' })

      const reloadedUser = await User.query()
        .preload('compositions', { andNot: { content: 'Goodbye' } })
        .firstOrFail()
      expect(reloadedUser.compositions).toMatchDreamModels([composition])

      const reloadedUser2 = await User.query()
        .preload('compositions', { andNot: { content: 'Hello' } })
        .firstOrFail()
      expect(reloadedUser2.compositions).toEqual([])
    })

    it('supports andAny clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id, content: 'Hello' })

      const reloadedUser = await User.query()
        .preload('compositions', { andAny: [{ content: 'Goodbye' }] })
        .firstOrFail()
      expect(reloadedUser.compositions).toEqual([])

      const reloadedUser2 = await User.query()
        .preload('compositions', { andAny: [{ content: 'Goodbye' }, { content: 'Hello' }] })
        .firstOrFail()
      expect(reloadedUser2.compositions).toMatchDreamModels([composition])
    })

    it('supports andAny clauses with multiple terms', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const compositionX = await Composition.create({
        userId: user.id,
        content: 'Hello',
        metadata: { not: 'me' },
      })
      const compositionY = await Composition.create({
        userId: user.id,
        content: 'Hello',
        metadata: { hello: 'world' },
      })

      const reloadedUser1 = await User.query()
        .preload('compositions', { andAny: [{ content: 'Goodbye' }, { content: 'Hello' }] })
        .firstOrFail()
      expect(reloadedUser1.compositions).toMatchDreamModels([compositionX, compositionY])

      const reloadedUser2 = await User.query()
        .preload('compositions', {
          andAny: [{ content: 'Goodbye' }, { content: 'Hello', metadata: { hello: 'world' } }],
        })
        .firstOrFail()
      expect(reloadedUser2.compositions).toMatchDreamModels([compositionY])
    })

    context('when the association does not exist', () => {
      it('sets it to null', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = await User.query().preload('mainComposition').first()
        expect(reloadedUser!.mainComposition).toBeNull()
      })
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const balloon = await Latex.create({ color: 'blue' })
        const line = await BalloonLine.create({ balloon, material: 'ribbon' })

        const reloaded = await Balloon.query().preload('balloonLine').first()
        expect(reloaded!.balloonLine).toMatchDreamModel(line)
      })
    })
  })

  context('HasMany', () => {
    it('loads the associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition1 = await Composition.create({ user })
      const composition2 = await Composition.create({ user })

      const reloadedUser = await User.query().preload('compositions').first()
      expect(reloadedUser!.compositions).toMatchDreamModels([composition1, composition2])
    })

    it('supports where clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user, content: 'Hello' })
      const composition2 = await Composition.create({ user, content: 'Goodbye' })

      const reloadedUser = await User.query()
        .preload('compositions', { and: { content: 'Goodbye' } })
        .first()
      expect(reloadedUser!.compositions).toMatchDreamModels([composition2])
    })

    context('when no association exists', () => {
      it('sets it to an empty array', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = await User.query().preload('compositions').first()
        expect(reloadedUser!.compositions).toEqual([])
      })
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const balloon = await Latex.create({ user, color: 'blue' })

        const reloadedUser = await User.query().preload('balloons').first()
        expect(reloadedUser!.balloons).toMatchDreamModels([balloon])
      })
    })
  })

  context('when there are HasMany results', () => {
    it('sets the association to an empty array', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const reloadedUser = await User.query().preload('compositions').first()
      expect(reloadedUser!.compositions).toEqual([])
    })
  })

  context('BelongsTo', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user })
      const reloadedComposition = await Composition.query().preload('user').first()
      expect(reloadedComposition!.user).toMatchDreamModel(user)
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const balloon = await Latex.create({ color: 'blue' })
        await BalloonLine.create({ balloon, material: 'ribbon' })

        const reloaded = await BalloonLine.query().preload('balloon').first()
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

  it('can handle sibling preload', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, primary: true })
    const composition2 = await Composition.create({ user })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

    const reloadedUser = await User.query()
      .preload('compositions')
      .preload('mainComposition', 'compositionAssets')
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

        const reloadedUser = await User.query().preload('recentCompositions').first()
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
            .preload('compositions', 'passthroughCurrentLocalizedText')
            .preload('compositions', 'compositionAssets', 'passthroughCurrentLocalizedText')
            .first()
          expect(reloadedUser!.compositions[0]!.passthroughCurrentLocalizedText).toMatchDreamModel(
            compositionText2
          )
          expect(
            reloadedUser!.compositions[0]!.compositionAssets[0]!.passthroughCurrentLocalizedText
          ).toMatchDreamModel(compositionAssetText1)
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

        const reloadedUser = await User.query().preload('recentCompositions').first()
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

        const reloadedUser = await User.query().preload('featuredPost').first()
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
        const sanityCheckNode = await Node.query().preload('edges').first()
        expect(sanityCheckNode!.edges).toMatchDreamModels([edge1, edge2, edge3])

        const reloadedNode = await Node.query().preload('nonOmittedPositionEdgeNodes').first()
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

        const reloadedUser = await User.query().preload('notRecentCompositions').first()
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

        const reloadedUser = await User.query().preload('notRecentCompositions').first()
        expect(reloadedUser!.notRecentCompositions).toMatchDreamModels([composition])
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

        const reloadedUser = await User.preload('reverseOrderedCompositions').first()
        expect(reloadedUser!.reverseOrderedCompositions[0]).toMatchDreamModel(lastComposition)
        expect(reloadedUser!.reverseOrderedCompositions[1]).toMatchDreamModel(firstComposition)
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

        const reloaded = await Pet.preload('currentCollar').first()
        expect(reloaded?.currentCollar).toMatchDreamModel(currentCollar)
      })
    })

    context('with NON-matching where-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.preload('currentCollar').first()
        expect(reloaded?.currentCollar).toBeNull()
      })
    })

    context('with matching whereNot-clause-on-the-association', () => {
      it('does not load the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.preload('notLostCollar').first()
        expect(reloaded?.notLostCollar).toBeNull()
      })
    })

    context('with NON-matching whereNot-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const pet = await Pet.create()
        const notLostCollar = await pet.createAssociation('collars', {
          lost: false,
        })

        const reloaded = await Pet.preload('notLostCollar').first()
        expect(reloaded?.notLostCollar).toMatchDreamModel(notLostCollar)
      })
    })
  })

  context('with default scopes on the preloaded models', () => {
    context('preloading a HasMany', () => {
      it('applies default scopes when joining', async () => {
        const pet = await Pet.create({ name: 'aster' })
        await pet.createAssociation('collars', { tagName: 'Aster', pet, hidden: true })

        const result = await Pet.preload('collars').first()
        expect(result!.collars).toHaveLength(0)
      })
    })

    context('preloading a BelongsTo', () => {
      it('applies default scopes when joining', async () => {
        const pet = await Pet.create({ name: 'aster', deletedAt: DateTime.now() })
        await pet.createAssociation('collars', { tagName: 'Aster', pet })

        const result = await Collar.preload('pet').first()
        expect(result!.pet).toBeNull()
      })
    })
  })

  it.skip('type test', async () => {
    // preload allows re-using of association names since preloading does not occur within a single
    // query, so will not result in namespace collision
    await Edge.preload('nodes', 'edges', 'nodes').all()
  })
})
