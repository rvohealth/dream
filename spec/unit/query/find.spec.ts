import DataTypeColumnTypeMismatch from '../../../src/errors/db/DataTypeColumnTypeMismatch.js'
import ops from '../../../src/ops/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#find', () => {
  let user: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred o' })
  })

  it('returns the matching Dream model', async () => {
    const reloadedUser = await User.query().find(user.id)
    expect(reloadedUser).toMatchDreamModel(user)
  })

  context('when passed undefined', () => {
    it('returns null', async () => {
      expect(await User.query().find(undefined)).toBeNull()
    })
  })

  context('when passed null', () => {
    it('returns null', async () => {
      expect(await User.query().find(null)).toBeNull()
    })
  })

  context('when passed the id of a nonextant User', () => {
    it('returns null', async () => {
      expect(await User.query().find((parseInt(user.id) + 1).toString())).toBeNull()
    })
  })

  context('when passed a similarity clause', () => {
    it('correctly filters on similarity text', async () => {
      expect(
        await User.query()
          .where({ name: ops.similarity('fredo') })
          .find(user.id)
      ).toMatchDreamModel(user)
      expect(
        await User.query()
          .where({ name: ops.similarity('nonmatch') })
          .find(user.id)
      ).toBeNull()
    })
  })

  context('when passed a transaction', () => {
    it('can find records', async () => {
      await ApplicationModel.transaction(async txn => {
        expect(await User.query().txn(txn).find(user.id)).toMatchDreamModel(user)
      })
    })

    context('when passed undefined', () => {
      it('returns null', async () => {
        await ApplicationModel.transaction(async txn => {
          expect(await User.query().txn(txn).find(undefined)).toBeNull()
        })
      })
    })

    context('when passed null', () => {
      it('returns null', async () => {
        await ApplicationModel.transaction(async txn => {
          expect(await User.query().txn(txn).find(null)).toBeNull()
        })
      })
    })
  })

  context('when passed a value the primary key column cannot hold', () => {
    it('returns null', async () => {
      expect(await User.query().find('abc')).toBeNull()
    })

    it('returns null from an association query', async () => {
      expect(await user.associationQuery('posts').find('abc')).toBeNull()
    })

    context('in a transaction', () => {
      it('raises DataTypeColumnTypeMismatch, since the database has aborted the transaction', async () => {
        await expect(
          ApplicationModel.transaction(async txn => {
            await User.query().txn(txn).find('abc')
          })
        ).rejects.toThrow(DataTypeColumnTypeMismatch)
      })
    })
  })

  context('when a negated clause holds a value its column cannot hold', () => {
    it('raises DataTypeColumnTypeMismatch instead of returning null for the matching record', async () => {
      await expect(User.query().whereNot({ uuid: 'abc' }).find(user.id)).rejects.toThrow(
        DataTypeColumnTypeMismatch
      )
    })

    it('returns null when the primary key is a value its column cannot hold', async () => {
      expect(await User.query().whereNot({ uuid: 'abc' }).find('abc')).toBeNull()
    })
  })

  context('when a whereAny branch holds a value its column cannot hold', () => {
    it('raises DataTypeColumnTypeMismatch instead of returning null for the matching record', async () => {
      await expect(
        User.query()
          .whereAny([{ uuid: 'abc' }, { email: 'fred@frewd' }])
          .find(user.id)
      ).rejects.toThrow(DataTypeColumnTypeMismatch)
    })
  })

  context('when a leftJoinPreload and-clause holds a value its column cannot hold', () => {
    it('raises DataTypeColumnTypeMismatch instead of returning null for the found record', async () => {
      await expect(
        User.query()
          .leftJoinPreload('posts', { and: { id: 'abc' } })
          .find(user.id)
      ).rejects.toThrow(DataTypeColumnTypeMismatch)
    })
  })

  context('when a where clause holds a date its column cannot hold', () => {
    it('raises DataTypeColumnTypeMismatch instead of returning null for the matching record', async () => {
      await expect(
        User.query()
          .whereNot({ birthdate: 'garbage' as any })
          .find(user.id)
      ).rejects.toThrow(DataTypeColumnTypeMismatch)
    })
  })

  context('when a preload clause holds a value its column cannot hold', () => {
    it('raises DataTypeColumnTypeMismatch instead of returning null for the found record', async () => {
      await expect(
        User.query()
          .preload('ratings', { and: { id: 'abc' } })
          .find(user.id)
      ).rejects.toThrow(DataTypeColumnTypeMismatch)
    })
  })

  context('with a preload', () => {
    it('loads the association onto the found record', async () => {
      const post = await user.createAssociation('posts')
      const reloadedUser = await User.query().preload('posts').find(user.id)
      expect(reloadedUser!.posts).toMatchDreamModels([post])
    })
  })
})
