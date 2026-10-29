import Decorators from '../../../../../src/decorators/Decorators.js'
import ops from '../../../../../src/ops/index.js'
import Post from '../../../../../test-app/app/models/Post.js'
import User from '../../../../../test-app/app/models/User.js'

describe('similarity operators in HasOne/HasMany association declarations', () => {
  // Similarity conditions are applied by a ranked trigram subquery that the
  // driver builds only from a Query's own where and join conditions, so one in
  // an association declaration was silently dropped. The declaration option
  // types reject them; this spec pins that at compile time. Each class below is
  // never processed as a model, so nothing here reaches the database.
  it('rejects ops.similarity, ops.wordSimilarity and ops.strictWordSimilarity in and, andNot and andAny', () => {
    const deco = new Decorators<typeof User2>()
    class User2 extends User {
      // @ts-expect-error similarity operators are not supported in an association declaration
      @deco.HasMany('Post', { and: { body: ops.similarity('hello') } })
      public similarityAnd: Post[]

      // @ts-expect-error similarity operators are not supported in an association declaration
      @deco.HasMany('Post', { and: { body: ops.wordSimilarity('hello') } })
      public wordSimilarityAnd: Post[]

      // @ts-expect-error similarity operators are not supported in an association declaration
      @deco.HasMany('Post', { and: { body: ops.strictWordSimilarity('hello') } })
      public strictWordSimilarityAnd: Post[]

      // @ts-expect-error similarity operators are not supported in an association declaration
      @deco.HasMany('Post', { andNot: { body: ops.similarity('hello') } })
      public similarityAndNot: Post[]

      // @ts-expect-error similarity operators are not supported in an association declaration
      @deco.HasMany('Post', { andAny: [{ body: ops.similarity('hello') }] })
      public similarityAndAny: Post[]

      // @ts-expect-error similarity operators are not supported in an association declaration
      @deco.HasOne('Post', { and: { body: ops.similarity('hello') } })
      public hasOneSimilarityAnd: Post

      // the other operators, and plain values, remain accepted
      @deco.HasMany('Post', { and: { body: ops.like('%hello%') } })
      public likeAnd: Post[]

      @deco.HasMany('Post', { andNot: { body: 'hello' } })
      public plainAndNot: Post[]

      @deco.HasMany('Post', { andAny: [{ body: ops.not.equal('hello') }, { body: null }] })
      public opsAndAny: Post[]
    }

    expect(User2).toBeDefined()
  })

  it('still accepts a similarity operator at the call site', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const helloPost = await Post.create({ user, body: 'hello world' })
    await Post.create({ user, body: 'goodbye' })

    const posts = await user.associationQuery('posts', { and: { body: ops.similarity('hello') } }).all()
    expect(posts).toMatchDreamModels([helloPost])
  })
})
