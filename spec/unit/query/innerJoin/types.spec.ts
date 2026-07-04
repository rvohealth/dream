import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Rating from '../../../../test-app/app/models/Rating.js'
import User from '../../../../test-app/app/models/User.js'

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', () => {
    User.query()
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      .innerJoin('invalid')

    User.innerJoin('allPets', {
      and: {
        // @ts-expect-error intentionally passing invalid arg to test that type protection is working
        invalidArg: 123,
      },
    })
  })

  it('forbids joining a polymorphic BelongsTo association, which raises at runtime', () => {
    Rating.query()
      // @ts-expect-error joining a polymorphic BelongsTo raises CannotJoinPolymorphicBelongsToError
      .innerJoin('rateable')

    Rating.query()
      // @ts-expect-error joining a polymorphic BelongsTo raises CannotJoinPolymorphicBelongsToError
      .innerJoin('rateable as r')

    Rating.query()
      // @ts-expect-error joining a polymorphic BelongsTo raises CannotJoinPolymorphicBelongsToError
      .innerJoin('rateable', 'comments')
  })

  it('forbids reusing an association name or alias as a namespace within a single chain', () => {
    // allowed: distinct namespaces
    User.query().innerJoin('posts as p', 'comments')

    User.query()
      // @ts-expect-error the alias 'comments' collides with the later association name 'comments'
      .innerJoin('posts as comments', 'comments')

    User.query()
      // @ts-expect-error the association name 'comments' is used as a namespace twice
      .innerJoin('posts', 'comments', 'post', 'comments')

    User.query()
      // @ts-expect-error the association name 'comments' is used as a namespace twice (mid-chain)
      .innerJoin('posts', 'comments', 'post', 'comments', { and: { body: 'hello' } })
  })

  it('forbids arrays of association names', () => {
    User.query()
      // @ts-expect-error joins do not support arrays of association names
      .innerJoin('posts', ['comments', 'ratings'])

    User.query()
      // @ts-expect-error an array of association names is only allowed as the final argument
      .innerJoin(['posts'], 'compositions')
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(txn => {
        User.query()
          .txn(txn)
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          .innerJoin('invalid')

        User.query()
          .txn(txn)
          .innerJoin('allPets', {
            and: {
              // @ts-expect-error intentionally passing invalid arg to test that type protection is working
              invalidArg: 123,
            },
          })
      })
    })
  })
})
