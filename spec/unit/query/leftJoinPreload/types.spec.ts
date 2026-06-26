import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import BalloonSpotter from '../../../../test-app/app/models/BalloonSpotter.js'
import User from '../../../../test-app/app/models/User.js'

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', () => {
    User.query()
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      .leftJoinPreload('invalid')

    User.leftJoinPreload('allPets', {
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
      .leftJoinPreload('balloonSpotterBalloons', 'balloon', { and: { color: 'blue' } })

    // allowed: constraint on a HasMany
    User.query().leftJoinPreload('balloons', { and: { color: 'red' } })

    // allowed: constraint on a HasOne
    User.query().leftJoinPreload('mainComposition', { and: { content: 'hello' } })

    // allowed: constraint on an optional BelongsTo
    User.query().leftJoinPreload('balloons', 'shapable', { and: { name: 'octagon' } })
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(txn => {
        User.query()
          .txn(txn)
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          .leftJoinPreload('invalid')

        User.query()
          .txn(txn)
          .leftJoinPreload('allPets', {
            and: {
              // @ts-expect-error intentionally passing invalid arg to test that type protection is working
              invalidArg: 123,
            },
          })

        BalloonSpotter.query()
          .txn(txn)
          // @ts-expect-error constraint on a non-optional BelongsTo is forbidden
          .leftJoinPreload('balloonSpotterBalloons', 'balloon', { and: { color: 'blue' } })
      })
    })
  })
})
