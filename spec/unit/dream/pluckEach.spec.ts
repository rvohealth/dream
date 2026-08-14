import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#pluckEach', () => {
  let user1: User
  let user2: User
  beforeEach(async () => {
    user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
  })

  it('plucks the specified attributes and returns them as raw data', async () => {
    const ids: any[] = []
    await User.pluckEach('id', id => {
      ids.push(id)
    })
    expect(ids).toEqual([user1.id, user2.id])
  })

  context('with chunk size specified', () => {
    it('plucks the specified attributes and returns them as raw data', async () => {
      const ids: string[] = []
      await User.pluckEach(
        'id',
        id => {
          ids.push(id)
        },
        { batchSize: 1 }
      )
      expect(ids).toEqual([user1.id, user2.id])
    })
  })

  context('when encased in a transaction', () => {
    it('plucks the specified attributes and returns them as raw data', async () => {
      let user3: User | null = null
      const ids: any[] = []

      await ApplicationModel.transaction(async txn => {
        user3 = await User.txn(txn).create({ email: 'fred@txn', password: 'howyadoin' })
        await User.txn(txn).pluckEach('id', id => {
          ids.push(id)
        })
      })
      expect(ids).toEqual([user1.id, user2.id, user3!.id])
    })
  })

  context('with multiple fields', () => {
    it('should return multi-dimensional array', async () => {
      const data: any[] = []
      await User.order('id').pluckEach('id', 'createdAt', (...arr) => {
        data.push(arr)
      })

      expect(data).toEqual([
        [user1.id, user1.createdAt],
        [user2.id, user2.createdAt],
      ])
    })
  })
})

context.skip('type tests', () => {
  type IsAny<T> = 0 extends 1 & T ? true : false
  type IsNever<T> = [T] extends [never] ? true : false
  type ExpectFalse<T extends false> = T

  it('validates static fields and preserves static callback types', async () => {
    await User.pluckEach(
      // @ts-expect-error invalidField is not a User column
      'invalidField',
      invalidField => {
        type InvalidFieldIsNotAny = ExpectFalse<IsAny<typeof invalidField>>
        type InvalidFieldIsNotNever = ExpectFalse<IsNever<typeof invalidField>>

        void invalidField
        void (null as unknown as InvalidFieldIsNotAny)
        void (null as unknown as InvalidFieldIsNotNever)
      }
    )

    await User.pluckEach('id', 'createdAt', (id, createdAt) => {
      type IdIsNotAny = ExpectFalse<IsAny<typeof id>>
      type IdIsNotNever = ExpectFalse<IsNever<typeof id>>
      type CreatedAtIsNotAny = ExpectFalse<IsAny<typeof createdAt>>
      type CreatedAtIsNotNever = ExpectFalse<IsNever<typeof createdAt>>

      const values: [User['id'], User['createdAt']] = [id, createdAt]
      // @ts-expect-error id retains its string type
      const invalidId: number = id
      // @ts-expect-error createdAt retains its DateTime type
      const invalidCreatedAt: string = createdAt

      void (null as unknown as IdIsNotAny)
      void (null as unknown as IdIsNotNever)
      void (null as unknown as CreatedAtIsNotAny)
      void (null as unknown as CreatedAtIsNotNever)
      void values
      void invalidId
      void invalidCreatedAt
    })
  })

  it('validates transaction fields and preserves transaction callback types', async () => {
    await ApplicationModel.transaction(async txn => {
      await User.txn(txn).pluckEach(
        // @ts-expect-error invalidField is not an updateable User property
        'invalidField',
        invalidField => {
          type InvalidFieldIsNotAny = ExpectFalse<IsAny<typeof invalidField>>
          type InvalidFieldIsNotNever = ExpectFalse<IsNever<typeof invalidField>>

          void invalidField
          void (null as unknown as InvalidFieldIsNotAny)
          void (null as unknown as InvalidFieldIsNotNever)
        }
      )

      await User.txn(txn).pluckEach('name', name => {
        type NameIsNotAny = ExpectFalse<IsAny<typeof name>>
        type NameIsNotNever = ExpectFalse<IsNever<typeof name>>

        const value: User['name'] = name
        // @ts-expect-error name retains its nullable string type
        const invalidName: number = name

        void (null as unknown as NameIsNotAny)
        void (null as unknown as NameIsNotNever)
        void value
        void invalidName
      })
    })
  })
})
