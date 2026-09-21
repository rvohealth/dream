import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Rating from '../../../../test-app/app/models/Rating.js'
import User from '../../../../test-app/app/models/User.js'

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', () => {
    User.query()
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      .leftJoin('invalid')

    User.leftJoin('allPets', {
      and: {
        // @ts-expect-error intentionally passing invalid arg to test that type protection is working
        invalidArg: 123,
      },
    })
  })

  it('forbids joining a polymorphic BelongsTo association, which raises at runtime', () => {
    Rating.query()
      // @ts-expect-error joining a polymorphic BelongsTo raises CannotJoinPolymorphicBelongsToError
      .leftJoin('rateable')

    Rating.query()
      // @ts-expect-error joining a polymorphic BelongsTo raises CannotJoinPolymorphicBelongsToError
      .leftJoin('rateable as r')

    Rating.query()
      // @ts-expect-error joining a polymorphic BelongsTo raises CannotJoinPolymorphicBelongsToError
      .leftJoin('rateable', 'comments')
  })

  it('forbids reusing an association name or alias as a namespace within a single chain', () => {
    // allowed: distinct namespaces
    User.query().leftJoin('posts as p', 'comments')

    User.query()
      // @ts-expect-error the alias 'comments' collides with the later association name 'comments'
      .leftJoin('posts as comments', 'comments')

    User.query()
      // @ts-expect-error the association name 'comments' is used as a namespace twice
      .leftJoin('posts', 'comments', 'post', 'comments')

    User.query()
      // @ts-expect-error the association name 'comments' is used as a namespace twice (mid-chain)
      .leftJoin('posts', 'comments', 'post', 'comments', { and: { body: 'hello' } })
  })

  it('forbids arrays of association names', () => {
    User.query()
      // @ts-expect-error joins do not support arrays of association names
      .leftJoin('posts', ['comments', 'ratings'])

    User.query()
      // @ts-expect-error an array of association names is only allowed as the final argument
      .leftJoin(['posts'], 'compositions')
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(txn => {
        User.query()
          .txn(txn)
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          .leftJoin('invalid')

        User.query()
          .txn(txn)
          .leftJoin('allPets', {
            and: {
              // @ts-expect-error intentionally passing invalid arg to test that type protection is working
              invalidArg: 123,
            },
          })
      })
    })
  })
})
