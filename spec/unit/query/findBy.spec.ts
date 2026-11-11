import DataTypeColumnTypeMismatch from '../../../src/errors/db/DataTypeColumnTypeMismatch.js'
import { sql } from 'kysely'
import CannotPassUndefinedAsAValueToAWhereClause from '../../../src/errors/CannotPassUndefinedAsAValueToAWhereClause.js'
import ops from '../../../src/ops/index.js'
import User from '../../../test-app/app/models/User.js'
import testDb from '../../helpers/testDb.js'
import Composition from '../../../test-app/app/models/Composition.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import LocalizedText from '../../../test-app/app/models/LocalizedText.js'
import Pet from '../../../test-app/app/models/Pet.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'

describe('Query#findBy', () => {
  let user: User
  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred o' })
  })

  it('applies a where query and grabs first result', async () => {
    const reloadedUser = await User.query().findBy({ email: 'fred@frewd' })
    expect(reloadedUser).toMatchDreamModel(user)
  })

  context('when passed undefined as a value', () => {
    it('raises an exception', async () => {
      await expect(async () => await User.query().findBy({ email: undefined as any })).rejects.toThrowError(
        CannotPassUndefinedAsAValueToAWhereClause
      )
    })
  })

  context('when provided an association', () => {
    it('is able to locate records in the database by the provided instance', async () => {
      const pet = await Pet.create({ user })
      expect(await Pet.query().findBy({ user })).toMatchDreamModel(pet)
    })
  })

  context('similarity operator is used', () => {
    it('filters results on similarity match', async () => {
      expect(await User.query().findBy({ name: ops.similarity('fredo') })).toMatchDreamModel(user)
      expect(await User.query().findBy({ name: ops.similarity('nonmatch') })).toBeNull()
    })
  })

  context('polymorphic', () => {
    it('correctly scopes the query by type and foreign key', async () => {
      // restarting sequence on both composiitons and composition assets,
      // since this will force the findBy to ensure that the foreign key type
      // is also provided to narrow down results, or else this spec will fail
      await sql`ALTER SEQUENCE compositions_id_seq RESTART 1;`.execute(testDb('default', 'primary'))
      await sql`ALTER SEQUENCE composition_assets_id_seq RESTART 1;`.execute(testDb('default', 'primary'))

      const composition = await Composition.create({ user })
      const compositionAsset = await CompositionAsset.create({ composition })

      const localizedText1 = await LocalizedText.create({ localizable: composition, locale: 'en-US' })
      const localizedText2 = await LocalizedText.create({
        localizable: compositionAsset,
        locale: 'en-US',
      })

      expect(await LocalizedText.findBy({ localizable: composition })).toMatchDreamModel(localizedText1)
      expect(await LocalizedText.findBy({ localizable: compositionAsset })).toMatchDreamModel(localizedText2)
    })
  })

  context('when passed a value its column cannot hold', () => {
    it('returns null', async () => {
      expect(await User.query().findBy({ id: '99999999999999999999' })).toBeNull()
      expect(await User.query().findBy({ uuid: 'abc' })).toBeNull()
    })

    context('in a transaction', () => {
      it('raises DataTypeColumnTypeMismatch, since the database has aborted the transaction', async () => {
        await expect(
          ApplicationModel.transaction(async txn => {
            await User.query().txn(txn).findBy({ id: 'abc' })
          })
        ).rejects.toThrow(DataTypeColumnTypeMismatch)
      })
    })
  })

  context('when passed a date its column cannot hold', () => {
    it('returns null', async () => {
      expect(await User.query().findBy({ birthdate: 'garbage' as any })).toBeNull()
    })

    context('in a transaction', () => {
      it('returns null, and the transaction continues', async () => {
        await ApplicationModel.transaction(async txn => {
          expect(
            await User.query()
              .txn(txn)
              .findBy({ birthdate: 'garbage' as any })
          ).toBeNull()
          expect(await User.query().txn(txn).findBy({ email: 'fred@frewd' })).toMatchDreamModel(user)
        })
      })
    })
  })

  context('when a negated clause holds a value its column cannot hold', () => {
    it('raises DataTypeColumnTypeMismatch instead of returning null for the matching record', async () => {
      await expect(User.query().whereNot({ uuid: 'abc' }).findBy({ email: 'fred@frewd' })).rejects.toThrow(
        DataTypeColumnTypeMismatch
      )
    })

    it('raises DataTypeColumnTypeMismatch when the value is a date', async () => {
      await expect(
        User.query()
          .whereNot({ birthdate: 'garbage' as any })
          .findBy({ email: 'fred@frewd' })
      ).rejects.toThrow(DataTypeColumnTypeMismatch)
    })

    it('returns null when a value of the lookup is one its column cannot hold', async () => {
      expect(await User.query().whereNot({ email: 'other@frewd' }).findBy({ uuid: 'abc' })).toBeNull()
    })
  })

  context('when an ops.not value in the lookup is one its column cannot hold', () => {
    it('raises DataTypeColumnTypeMismatch instead of returning null for the matching record', async () => {
      await expect(User.query().findBy({ uuid: ops.not.equal('abc') })).rejects.toThrow(
        DataTypeColumnTypeMismatch
      )
    })
  })

  context('when an ops.equal value in the lookup is one its column cannot hold', () => {
    it('returns null', async () => {
      expect(await User.query().findBy({ uuid: ops.equal('abc') })).toBeNull()
    })
  })

  context('when one member of a list of values is one its column cannot hold', () => {
    it('raises DataTypeColumnTypeMismatch instead of returning null for the matching record', async () => {
      await expect(User.query().findBy({ uuid: [user.uuid, 'abc'] })).rejects.toThrow(
        DataTypeColumnTypeMismatch
      )
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('ensures invalid arguments error', async () => {
    await User.query().findBy({
      // @ts-expect-error intentionally passing invalid arg to test that type protection is working
      invalidArg: 123,
    })
  })

  context('in a transaction', () => {
    it('ensures invalid arguments error', async () => {
      await ApplicationModel.transaction(async txn => {
        await User.txn(txn).queryInstance().findBy({
          // @ts-expect-error intentionally passing invalid arg to test that type protection is working
          invalidArg: 123,
        })
      })
    })
  })
})
