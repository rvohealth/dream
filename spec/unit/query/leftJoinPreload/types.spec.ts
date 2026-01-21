import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
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
      })
    })
  })
})
