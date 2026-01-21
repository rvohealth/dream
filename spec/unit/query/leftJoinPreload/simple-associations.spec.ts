import { DateTime } from '../../../../src/helpers/DateTime.js'
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

describe('Query#leftJoinPreload with simple associations', () => {
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
      const reloaded = await User.query().leftJoinPreload(['balloons', 'compositions']).firstOrFail()
      expect(reloaded.balloons).toMatchDreamModels([balloon])
      expect(reloaded.compositions).toMatchDreamModels([composition])
    })

    it('can be loaded via subsequent leftJoinPreload queries', async () => {
      const reloaded = await User.query()
        .leftJoinPreload('balloons')
        .leftJoinPreload('compositions')
        .firstOrFail()
      expect(reloaded.balloons).toMatchDreamModels([balloon])
      expect(reloaded.compositions).toMatchDreamModels([composition])
    })
  })

  context('with an association provided as an argument to the and clause', () => {
    it('supports associations as clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const pet = await Pet.create({ user, name: 'aster' })
      await Pet.create({ user, name: 'violet' })

      const collar = await pet.createAssociation('collars')

      const reloaded = await User.query()
        .leftJoinPreload('pets', { and: { name: 'aster' } }, 'collars')
        .firstOrFail()
      expect(reloaded.pets[0]!.collars).toMatchDreamModels([collar])
    })
  })

  context('HasOne', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id, primary: true })

      const reloadedUser = await User.query().leftJoinPreload('mainComposition').firstOrFail()
      expect(reloadedUser.mainComposition).toMatchDreamModel(composition)
    })

    it('supports and-clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ userId: user.id, primary: true, content: 'Hello' })

      const reloadedUser = await User.query()
        .leftJoinPreload('mainComposition', { and: { content: 'Goodbye' } })
        .firstOrFail()
      expect(reloadedUser.mainComposition).toBeNull()

      const reloadedUser2 = await User.query()
        .leftJoinPreload('mainComposition', { and: { content: 'Hello' } })
        .firstOrFail()
      expect(reloadedUser2.mainComposition).toMatchDreamModel(composition)
    })

    context('when the association does not exist', () => {
      it('sets it to null', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = await User.query().leftJoinPreload('mainComposition').firstOrFail()
        expect(reloadedUser.mainComposition).toBeNull()
      })
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const balloon = await Latex.create({ color: 'blue' })
        const line = await BalloonLine.create({ balloon, material: 'ribbon' })

        const reloaded = await Balloon.query().leftJoinPreload('balloonLine').firstOrFail()
        expect(reloaded.balloonLine).toMatchDreamModel(line)
      })
    })
  })

  context('HasMany', () => {
    it('loads the associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition1 = await Composition.create({ user })
      const composition2 = await Composition.create({ user })

      const reloadedUser = await User.query().leftJoinPreload('compositions').firstOrFail()
      expect(reloadedUser.compositions).toMatchDreamModels([composition1, composition2])
    })

    it('supports and-clauses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user, content: 'Hello' })
      const composition2 = await Composition.create({ user, content: 'Goodbye' })

      const reloadedUser = await User.query()
        .leftJoinPreload('compositions', { and: { content: 'Goodbye' } })
        .firstOrFail()
      expect(reloadedUser.compositions).toMatchDreamModels([composition2])
    })

    context('when no association exists', () => {
      it('sets it to an empty array', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = await User.query().leftJoinPreload('compositions').firstOrFail()
        expect(reloadedUser.compositions).toEqual([])
      })
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const balloon = await Latex.create({ user, color: 'blue' })

        const reloadedUser = await User.query().leftJoinPreload('balloons').firstOrFail()
        expect(reloadedUser.balloons).toMatchDreamModels([balloon])
      })
    })
  })

  context('when there are HasMany results', () => {
    it('sets the association to an empty array', async () => {
      await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const reloadedUser = await User.query().leftJoinPreload('compositions').firstOrFail()
      expect(reloadedUser.compositions).toEqual([])
    })
  })

  context('BelongsTo', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user })
      const reloadedComposition = await Composition.query().leftJoinPreload('user').firstOrFail()
      expect(reloadedComposition.user).toMatchDreamModel(user)
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const balloon = await Latex.create({ color: 'blue' })
        await BalloonLine.create({ balloon, material: 'ribbon' })

        const reloaded = await BalloonLine.query().leftJoinPreload('balloon').firstOrFail()
        expect(reloaded.balloon).toMatchDreamModel(balloon)
      })
    })

    context('withoutDefaultScopes', () => {
      it('removes the default scope when applying the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'password' })
        const post = await Post.create({ user })
        const postComment = await PostComment.create({ post })

        await post.destroy()

        const reloadedPostComment = await postComment.leftJoinLoad('post').execute()
        expect(reloadedPostComment.post).toBeNull()

        const reloadedPostComment2 = await postComment.leftJoinLoad('postEvenIfDeleted').execute()
        expect(reloadedPostComment2.postEvenIfDeleted).toMatchDreamModel(post)
      })
    })
  })

  it('can handle sibling leftJoinPreload statements', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, primary: true })
    const composition2 = await Composition.create({ user })
    const compositionAsset = await CompositionAsset.create({ compositionId: composition.id })

    const reloadedUser = await User.query()
      .leftJoinPreload('compositions')
      .leftJoinPreload('mainComposition', 'compositionAssets')
      .firstOrFail()

    expect(reloadedUser.compositions).toMatchDreamModels([composition, composition2])
    expect(reloadedUser.mainComposition).toMatchDreamModel(composition)
    expect(reloadedUser.mainComposition.compositionAssets).toMatchDreamModels([compositionAsset])
  })

  context('HasMany', () => {
    context('with matching and-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({
          user,
          createdAt: DateTime.now().minus({ day: 1 }),
        })

        const reloadedUser = await User.query().leftJoinPreload('recentCompositions').firstOrFail()
        expect(reloadedUser.recentCompositions).toMatchDreamModels([composition])
      })

      context('with "passthrough"', () => {
        it('loads the associated object', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

          const composition = await Composition.create({ user })
          await LocalizedText.create({ localizable: composition, locale: 'en-US' })
          const compositionText2 = await LocalizedText.create({ localizable: composition, locale: 'es-ES' })

          const reloadedUser = await User.query()
            .passthrough({ locale: 'es-ES' })
            .leftJoinPreload('compositions', 'passthroughCurrentLocalizedText')
            .firstOrFail()
          expect(reloadedUser.compositions[0]!.passthroughCurrentLocalizedText).toMatchDreamModel(
            compositionText2
          )
        })
      })
    })

    context('with NON-matching and-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const reloadedUser = await User.query().leftJoinPreload('recentCompositions').firstOrFail()
        expect(reloadedUser.recentCompositions).toEqual([])
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

        const reloadedUser = await User.query().leftJoinPreload('featuredPost').firstOrFail()
        expect(reloadedUser.featuredPost).toMatchDreamModel(post2)
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
        const sanityCheckNode = await Node.query().leftJoinPreload('edges').firstOrFail()
        expect(sanityCheckNode.edges).toMatchDreamModels([edge1, edge2, edge3])

        const reloadedNode = await Node.query().leftJoinPreload('nonOmittedPositionEdgeNodes').firstOrFail()
        expect(reloadedNode.nonOmittedPositionEdgeNodes).toMatchDreamModels([edgeNode2, edgeNode3])
      })
    })

    context('with matching andNot-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          createdAt: DateTime.now().minus({ day: 1 }),
        })

        const reloadedUser = await User.query().leftJoinPreload('notRecentCompositions').firstOrFail()
        expect(reloadedUser.notRecentCompositions).toEqual([])
      })
    })

    context('with NON-matching andNot-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({
          user,
          createdAt: DateTime.now().minus({ year: 1 }),
        })

        const reloadedUser = await User.query().leftJoinPreload('notRecentCompositions').firstOrFail()
        expect(reloadedUser.notRecentCompositions).toMatchDreamModels([composition])
      })
    })
  })

  context('HasOne', () => {
    context('with matching and-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })
        const currentCollar = await pet.createAssociation('collars', {
          lost: false,
        })

        const reloaded = await Pet.leftJoinPreload('currentCollar').firstOrFail()
        expect(reloaded.currentCollar).toMatchDreamModel(currentCollar)
      })
    })

    context('with NON-matching and-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.leftJoinPreload('currentCollar').firstOrFail()
        expect(reloaded.currentCollar).toBeNull()
      })
    })

    context('with matching andNot-clause-on-the-association', () => {
      it('does not load the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.leftJoinPreload('notLostCollar').firstOrFail()
        expect(reloaded.notLostCollar).toBeNull()
      })
    })

    context('with NON-matching andNot-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const pet = await Pet.create()
        const notLostCollar = await pet.createAssociation('collars', {
          lost: false,
        })

        const reloaded = await Pet.leftJoinPreload('notLostCollar').firstOrFail()
        expect(reloaded.notLostCollar).toMatchDreamModel(notLostCollar)
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

        const reloadedUser = await User.leftJoinPreload('reverseOrderedCompositions').firstOrFail()
        expect(reloadedUser.reverseOrderedCompositions[0]).toMatchDreamModel(lastComposition)
        expect(reloadedUser.reverseOrderedCompositions[1]).toMatchDreamModel(firstComposition)
      })

      context('when the asscociation has been aliased', () => {
        it('loads the associated object', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
          const firstComposition = await Composition.create({
            user,
          })
          const lastComposition = await Composition.create({
            user,
          })

          const reloadedUser = await User.leftJoinPreload('reverseOrderedCompositions as roc').firstOrFail()
          expect(reloadedUser.reverseOrderedCompositions[0]).toMatchDreamModel(lastComposition)
          expect(reloadedUser.reverseOrderedCompositions[1]).toMatchDreamModel(firstComposition)
        })
      })
    })
  })

  context('with default scopes on the leftJoinPreloaded models', () => {
    context('loading a HasMany', () => {
      it('applies default scopes when joining', async () => {
        const pet = await Pet.create({ name: 'aster' })
        await pet.createAssociation('collars', { tagName: 'Aster', pet, hidden: true })

        const result = await Pet.leftJoinPreload('collars').firstOrFail()
        expect(result.collars).toHaveLength(0)
      })
    })

    context('loading a BelongsTo', () => {
      it('applies default scopes when joining', async () => {
        const pet = await Pet.create({ name: 'aster', deletedAt: DateTime.now() })
        await pet.createAssociation('collars', { tagName: 'Aster', pet })

        const result = await Collar.leftJoinPreload('pet').firstOrFail()
        expect(result.pet).toBeNull()
      })
    })
  })

  it.skip('type test', async () => {
    // leftJoinPreload does not allow re-using of association names since a
    // single query does not allow name collisions
    await Edge.leftJoinPreload('nodes', 'edges').all()
  })

  context('where association.property is null', () => {
    it('can find models that don’t have a particular association', async () => {
      const user1 = await User.create({ email: 'a@a.com', password: 'howyadoin' })
      const user2 = await User.create({ email: 'b@b.com', password: 'howyadoin' })
      await Composition.create({ user: user1 })

      const users = await User.query()
        .leftJoinPreload('compositions')
        .where({ 'compositions.id': null })
        .all()
      expect(users).toMatchDreamModels([user2])
    })

    it('can find associations that don’t have a particular association', async () => {
      const user = await User.create({ email: 'a@a.com', password: 'howyadoin' })
      const composition1 = await Composition.create({ user })
      const composition2 = await Composition.create({ user })
      await CompositionAsset.create({ composition: composition2 })

      const users = await User.query()
        .leftJoinPreload('compositions', 'compositionAssets')
        .where({ 'compositionAssets.id': null })
        .all()
      expect(users).toMatchDreamModels([user])
      expect(users[0]?.compositions).toMatchDreamModels([composition1])
    })
  })
})
