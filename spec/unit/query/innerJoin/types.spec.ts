import ops from '../../../../src/ops/index.js'
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

  it('forbids a condition key other than and, andNot and andAny', () => {
    User.query()
      // @ts-expect-error a condition accepts only and, andNot and andAny
      .innerJoin('posts', { and: { body: 'hello' }, body: 'hello' })

    User.query()
      // @ts-expect-error a condition accepts only and, andNot and andAny
      .innerJoin('posts', { and: { body: 'hello' }, body: 'hello' }, 'comments')

    User.query()
      // @ts-expect-error a condition accepts only and, andNot and andAny
      .innerJoin('posts', { an: { body: 'hello' } })

    // allowed: and, andNot and andAny together, at the end of the chain and mid-chain
    User.query().innerJoin('posts', {
      and: { body: 'hello' },
      andNot: { body: 'goodbye' },
      andAny: [{ body: 'hi' }],
    })
    User.query().innerJoin('posts', { and: { body: 'hello' }, andNot: { body: 'goodbye' } }, 'comments')
  })

  it('forbids a variable whose type declares a condition key other than and, andNot and andAny', () => {
    const condition: { and: { body: string }; body: string } = { and: { body: 'hello' }, body: 'hello' }

    User.query()
      // @ts-expect-error a condition accepts only and, andNot and andAny
      .innerJoin('posts', condition)

    User.query()
      // @ts-expect-error a condition accepts only and, andNot and andAny
      .innerJoin('posts', condition, 'comments')

    // allowed: a type that declares no specific keys, which the runtime check covers instead
    const untypedCondition: Record<string, unknown> = { and: { body: 'hello' } }
    User.query().innerJoin('posts', untypedCondition)
    User.query().innerJoin('posts', untypedCondition, 'comments')
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

  // The plain value form targets regular (scalar) columns; an array column is
  // compared through `ops`, e.g. `ops.equal(['red', 'green'])`.
  it('rejects a flat list against an array column', () => {
    // @ts-expect-error a flat list against an array column means IN; use ops.equal
    User.innerJoin('balloons', { and: { multicolor: ['red', 'green'] } })
    // @ts-expect-error a flat list against an array column means IN; use ops.equal
    User.innerJoin('balloons', { andNot: { multicolor: ['red', 'green'] } })
    // @ts-expect-error a flat list against an array column means IN; use ops.equal
    User.innerJoin('balloons', { andAny: [{ multicolor: ['red', 'green'] }] })
    // @ts-expect-error a flat list against an array column means IN; use ops.equal
    User.innerJoin('balloons').where({ 'balloons.multicolor': ['red', 'green'] })
  })

  it('accepts null, an empty list, a list of whole arrays and ops against an array column', () => {
    User.innerJoin('balloons', { and: { multicolor: null } })
    User.innerJoin('balloons', { and: { multicolor: [] } })
    User.innerJoin('balloons', { and: { multicolor: [['red', 'green'], null] } })
    User.innerJoin('balloons', { andNot: { multicolor: [['red', 'green'], null] } })
    User.innerJoin('balloons', { and: { multicolor: ops.equal(['red', 'green']) } })
    User.innerJoin('balloons').where({ 'balloons.multicolor': null })
    User.innerJoin('balloons').where({ 'balloons.multicolor': [['red', 'green'], null] })
    User.innerJoin('balloons').where({ 'balloons.multicolor': ops.equal(['red', 'green']) })
    User.innerJoin('balloons', { and: { color: ['red', 'blue'] } })
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

        User.query()
          .txn(txn)
          // @ts-expect-error a condition accepts only and, andNot and andAny
          .innerJoin('posts', { and: { body: 'hello' }, body: 'hello' })

        User.query()
          .txn(txn)
          // @ts-expect-error a condition accepts only and, andNot and andAny
          .innerJoin('posts', { and: { body: 'hello' }, body: 'hello' }, 'comments')
      })
    })
  })
})
