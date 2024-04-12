import User from '../../../test-app/app/models/User'
import ops from '../../../src/ops'
import Edge from '../../../test-app/app/models/Graph/Edge'
import MissingRequiredCallbackFunctionToPluckEach from '../../../src/exceptions/missing-required-callback-function-to-pluck-each'
import CannotPassAdditionalFieldsToPluckEachAfterCallback from '../../../src/exceptions/cannot-pass-additional-fields-to-pluck-each-after-callback-function'

describe('Query#pluckEach', () => {
  let user1: User
  let user2: User
  let user3: User

  beforeEach(async () => {
    user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'helloworld' })
    user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'hello world' })
    user3 = await User.create({ email: 'fred@fishman', password: 'howyadoin', name: 'herzog' })
  })

  it('plucks the specified attributes and returns them as raw data', async () => {
    const plucked: any[] = []
    await User.order('id').pluckEach('id', id => {
      plucked.push(id)
    })

    expect(plucked).toEqual([user1.id, user2.id, user3.id])
  })

  context('with invalid arguments', () => {
    context('when the cb function is not provided', () => {
      it('raises a targeted exception', async () => {
        await expect(async () => await User.query().pluckEach('id')).rejects.toThrowError(
          MissingRequiredCallbackFunctionToPluckEach
        )
      })
    })

    context('when additional pluck arguments are following the call to pluckEachThrough', () => {
      it('raises a targeted exception', async () => {
        await expect(async () => await User.query().pluckEach('id', () => {}, 'email')).rejects.toThrowError(
          CannotPassAdditionalFieldsToPluckEachAfterCallback
        )
      })
    })
  })

  context('columns that get transformed during marshalling', () => {
    context('a single value', () => {
      it('are properly marshalled', async () => {
        await Edge.create({ name: 'E1', weight: 2.3 })
        await Edge.create({ name: 'E2', weight: 7.1 })

        const plucked: any[] = []
        await Edge.query().pluckEach('weight', weight => {
          plucked.push(weight)
        })
        expect(plucked[0]).toEqual(2.3)
        expect(plucked[1]).toEqual(7.1)
      })
    })

    context('multiple values', () => {
      it('are properly marshalled', async () => {
        await Edge.create({ name: 'E1', weight: 2.3 })
        await Edge.create({ name: 'E2', weight: 7.1 })

        const plucked: any[] = []
        await Edge.query().pluckEach('name', 'weight', arr => {
          plucked.push(arr)
        })
        expect(plucked[0]).toEqual(['E1', 2.3])
        expect(plucked[1]).toEqual(['E2', 7.1])
      })
    })
  })

  context('with multiple fields', () => {
    it('should return multi-dimensional array', async () => {
      const plucked: any[] = []
      await User.order('id').pluckEach('id', 'createdAt', arr => {
        plucked.push(arr)
      })
      expect(plucked).toEqual([
        [user1.id, user1.createdAt],
        [user2.id, user2.createdAt],
        [user3.id, user3.createdAt],
      ])
    })
  })

  context('with a where clause specified', () => {
    it('respects the where clause', async () => {
      const plucked: any[] = []
      await User.order('id')
        .where({ name: 'helloworld' })
        .pluckEach('id', id => {
          plucked.push(id)
        })
      expect(plucked).toEqual([user1.id])
    })

    context('with a similarity operator', () => {
      it('respects the similarity operator', async () => {
        const plucked: any[] = []
        await User.where({ name: ops.similarity('hello world') }).pluckEach('id', id => {
          plucked.push(id)
        })

        expect(plucked).toEqual([user2.id, user1.id])
      })
    })
  })
})
