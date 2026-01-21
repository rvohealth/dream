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
