import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Post from '../../../test-app/app/models/Post.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#placeholder', () => {
  context('HasMany', () => {
    context('takeOne', () => {
      it('holds the place of an association', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const user = await User.query().placeholder('posts').firstOrFail()
        expect(user.posts).toEqual([])
      })

      context('an array provided', () => {
        it('holds the place of all provided associations', async () => {
          await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
          const user = await User.query().placeholder(['posts', 'postComments']).firstOrFail()
          expect(user.posts).toEqual([])
          expect(user.postComments).toEqual([])
        })
      })

      context('leftJoinPreload', () => {
        it('holds the place of an association', async () => {
          await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
          const user = await User.query().placeholder('posts').leftJoinPreload('balloons').firstOrFail()
          expect(user.posts).toEqual([])
        })
      })
    })

    context('takeAll', () => {
      it('holds the place of an association', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const user = (await User.query().placeholder('posts').all())[0]!
        expect(user.posts).toEqual([])
      })
    })
  })

  context('HasOne', () => {
    context('takeOne', () => {
      it('holds the place of an association', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const user = await User.query().placeholder('featuredPost').firstOrFail()
        expect(user.featuredPost).toBeNull()
      })
    })

    context('takeAll', () => {
      it('holds the place of an association', async () => {
        await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const user = (await User.query().placeholder('featuredPost').all())[0]!
        expect(user.featuredPost).toBeNull()
      })
    })
  })

  context('BelongsTo', () => {
    context('takeOne', () => {
      it('holds the place of an association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        await Post.create({ user })
        const post = await Post.query().placeholder('user').firstOrFail()
        expect(post.user).toBeNull()
      })
    })

    context('takeAll', () => {
      it('holds the place of an association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        await Post.create({ user })
        const post = (await Post.query().placeholder('user').all())[0]!
        expect(post.user).toBeNull()
      })
    })
  })

  context('when passed a transaction', () => {
    it('returns the min, traveling through nested associations', async () => {
      let user: User | undefined = undefined

      await ApplicationModel.transaction(async txn => {
        await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        user = await User.txn(txn).placeholder('posts').firstOrFail()
      })

      expect(user!.posts).toEqual([])
    })
  })
})
