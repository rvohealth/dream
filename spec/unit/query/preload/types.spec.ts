import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import BalloonSpotter from '../../../../test-app/app/models/BalloonSpotter.js'
import Post from '../../../../test-app/app/models/Post.js'
import Rating from '../../../../test-app/app/models/Rating.js'
import User from '../../../../test-app/app/models/User.js'

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', () => {
    User.query()
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      .preload('invalid')

    User.preload('allPets', {
      and: {
        // @ts-expect-error intentionally passing invalid arg to test that type protection is working
        invalidArg: 123,
      },
    })
  })

  it('forbids a trailing constraint on a non-optional BelongsTo, but allows it elsewhere', () => {
    // forbidden: a constraint on a non-optional (required) BelongsTo would null a
    // value the generated OpenAPI spec declares non-nullable.
    BalloonSpotter.query()
      // @ts-expect-error constraint on a non-optional BelongsTo is forbidden
      .preload('balloonSpotterBalloons', 'balloon', { and: { color: 'blue' } })

    BalloonSpotter.query()
      // @ts-expect-error constraint on a non-optional BelongsTo is forbidden, including mid-chain
      .preload('balloonSpotterBalloons', 'balloon', { and: { color: 'blue' } }, 'balloonLine')

    // allowed: continuing the chain through a non-optional BelongsTo without a constraint
    BalloonSpotter.query().preload('balloonSpotterBalloons', 'balloon', 'balloonLine')

    // allowed: constraint on a HasMany
    User.query().preload('balloons', { and: { color: 'red' } })

    // allowed: constraint on a HasOne
    User.query().preload('mainComposition', { and: { content: 'hello' } })

    // allowed: constraint on an optional BelongsTo
    User.query().preload('balloons', 'shapable', { and: { name: 'octagon' } })
  })

  it('validates and-clauses on an association traversed through an alias', () => {
    const user = undefined as unknown as User
    const post = undefined as unknown as Post

    // allowed: valid column constraint after an aliased association
    User.query().preload('posts as p', { and: { body: 'hello' } })

    // allowed: a model instance under a BelongsTo association key after an aliased association
    User.query().preload('posts as p', { and: { user } })

    User.query().preload('posts as p', {
      and: {
        // @ts-expect-error intentionally passing invalid arg to test that type protection is working
        invalidArg: 123,
      },
    })

    // @ts-expect-error a Post instance is not a valid value for the user association
    User.query().preload('posts as p', { and: { user: post } })
  })

  context('associations on the other side of a polymorphic belongs-to', () => {
    it('validates and-clauses after traversing to an association that exists on only one polymorphic target', () => {
      // allowed: valid column constraint on the traversed association
      Rating.query().preload('rateable', 'comments', { and: { body: 'hello' } })

      Rating.query().preload('rateable', 'comments', {
        and: {
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          invalidArg: 123,
        },
      })
    })

    it('supports aliases both on and after the polymorphic association', () => {
      // aliasing the polymorphic association itself, then traversing across the union
      Rating.query().preload('rateable as r', 'comments')

      // aliasing an association that exists on only one polymorphic target, then continuing the chain
      Rating.query().preload('rateable', 'comments as c', 'post')
    })
  })

  it('forbids an array of association names anywhere but the final argument', () => {
    // allowed: an array as the final argument
    User.query().preload('posts', ['comments', 'ratings'])

    User.query()
      // @ts-expect-error an array of association names is only allowed as the final argument
      .preload(['posts'], 'compositions')
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(txn => {
        User.query()
          .txn(txn)
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          .preload('invalid')

        User.query()
          .txn(txn)
          .preload('allPets', {
            and: {
              // @ts-expect-error intentionally passing invalid arg to test that type protection is working
              invalidArg: 123,
            },
          })

        BalloonSpotter.query()
          .txn(txn)
          // @ts-expect-error constraint on a non-optional BelongsTo is forbidden
          .preload('balloonSpotterBalloons', 'balloon', { and: { color: 'blue' } })
      })
    })
  })
})
