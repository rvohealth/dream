import { Kysely, sql } from 'kysely'
import DreamMigrationHelpers from '../../../../src/db/migration-helpers/DreamMigrationHelpers.js'
import DropEnumValueRetypeFailed from '../../../../src/errors/DropEnumValueRetypeFailed.js'
import db from '../../../../test-app/db/index.js'

describe('DreamMigrationHelpers.dropEnumValue', () => {
  let _db: Kysely<any>

  beforeEach(async () => {
    _db = db('default', 'primary')
    await _db.schema.createType('temp_enum').asEnum(['a', 'b', 'c']).execute()
  })

  afterEach(async () => {
    await _db.schema.dropType('temp_enum').execute()
  })

  it('removes the value from the enum', async () => {
    await DreamMigrationHelpers.dropEnumValue(_db, {
      enumName: 'temp_enum',
      value: 'c',
      replacements: [],
    })

    const response = await sql`SELECT unnest(enum_range(NULL::temp_enum))`.execute(_db)
    const allEnumValues = response.rows.map(row => (row as any).unnest)
    expect(allEnumValues).toEqual(['a', 'b'])
  })

  context('for a non-array enum field', () => {
    beforeEach(async () => {
      await _db.schema
        .alterTable('pets')
        .addColumn('temporary_enum', sql`temp_enum`)
        .execute()
    })

    afterEach(async () => {
      await _db.schema.alterTable('pets').dropColumn('temporary_enum').execute()
    })

    it('replaces dead value with specified replaceWith', async () => {
      await _db
        .insertInto('pets')
        .values({
          temporary_enum: 'c',
          created_at: '2024-02-02',
        })
        .execute()

      await DreamMigrationHelpers.dropEnumValue(_db, {
        enumName: 'temp_enum',
        value: 'c',
        replacements: [
          {
            table: 'pets',
            column: 'temporary_enum',
            behavior: 'replace',
            replaceWith: 'b',
          },
        ],
      })

      const pet = await _db.selectFrom('pets').selectAll().executeTakeFirst()
      expect(pet!.temporaryEnum).toEqual('b')
    })

    context('null is provided for replaceWith', () => {
      it('nullifies value', async () => {
        await _db
          .insertInto('pets')
          .values({
            temporary_enum: 'c',
            created_at: '2024-02-02',
          })
          .execute()

        await DreamMigrationHelpers.dropEnumValue(_db, {
          enumName: 'temp_enum',
          value: 'c',
          replacements: [
            {
              table: 'pets',
              column: 'temporary_enum',
              replaceWith: null,
            },
          ],
        })

        const pet = await _db.selectFrom('pets').selectAll().executeTakeFirst()
        expect(pet!.temporaryEnum).toBeNull()
      })
    })
  })

  // dropEnumValue always ships inside a migration transaction (runMigration.ts routes it
  // through `newTransaction`), so these examples run it through `_db.transaction()` rather
  // than against the autocommitting connection the examples above use. That difference is
  // load-bearing: once the retype below fails, Postgres aborts the transaction block, so any
  // catalog query issued after the failure would itself throw `25P02 current transaction is
  // aborted` and bury the error this suite is asserting on.
  context('within a migration transaction', () => {
    beforeEach(async () => {
      await _db.schema
        .alterTable('pets')
        .addColumn('temporary_enum', sql`temp_enum`)
        .execute()
    })

    afterEach(async () => {
      await _db.schema.alterTable('pets').dropColumn('temporary_enum').execute()
    })

    it('drops the value without incident when no check constraint blocks the retype', async () => {
      await _db
        .insertInto('pets')
        .values({
          temporary_enum: 'c',
          created_at: '2024-02-02',
        })
        .execute()

      await _db.transaction().execute(async trx => {
        await DreamMigrationHelpers.dropEnumValue(trx, {
          enumName: 'temp_enum',
          value: 'c',
          replacements: [
            {
              table: 'pets',
              column: 'temporary_enum',
              replaceWith: 'b',
            },
          ],
        })
      })

      const pet = await _db.selectFrom('pets').selectAll().executeTakeFirst()
      expect(pet!.temporaryEnum).toEqual('b')
    })

    context('a check constraint on the replacement column references the enum', () => {
      beforeEach(async () => {
        await _db.schema
          .alterTable('pets')
          .addCheckConstraint('temporary_enum_is_not_c_check', sql`temporary_enum <> 'c'`)
          .execute()
      })

      it('raises DropEnumValueRetypeFailed naming the table, the column and the check constraints', async () => {
        let error: unknown

        try {
          await _db.transaction().execute(async trx => {
            await DreamMigrationHelpers.dropEnumValue(trx, {
              enumName: 'temp_enum',
              value: 'c',
              replacements: [
                {
                  table: 'pets',
                  column: 'temporary_enum',
                  replaceWith: 'b',
                },
              ],
            })
          })
        } catch (err) {
          error = err
        }

        expect(error).toBeInstanceOf(DropEnumValueRetypeFailed)
        const retypeError = error as DropEnumValueRetypeFailed

        expect(retypeError.table).toEqual('pets')
        expect(retypeError.column).toEqual('temporary_enum')
        expect(retypeError.retypeDirection).toEqual('toText')
        expect(retypeError.checkConstraints).toEqual([
          { name: 'temporary_enum_is_not_c_check', definition: expect.stringContaining('CHECK') },
        ])

        // the table, the column and the constraint the raw Postgres error names nowhere
        expect(retypeError.message).toContain('pets')
        expect(retypeError.message).toContain('temporary_enum')
        expect(retypeError.message).toContain('temporary_enum_is_not_c_check')
        expect(retypeError.message).toContain('temp_enum')

        // the three outcomes the caller has to choose between
        expect(retypeError.message).toContain('should be dropped and never re-added')
        expect(retypeError.message).toContain('should be re-added exactly as it was')
        expect(retypeError.message).toContain('struck from it')

        // the original Postgres error stays reachable, and readable
        expect(retypeError.originalError.message).toContain('operator does not exist')
        expect(retypeError.cause).toBe(retypeError.originalError)
        expect(retypeError.message).toContain('operator does not exist')
      })
    })
  })

  context('for an enum array field', () => {
    beforeEach(async () => {
      await _db.schema
        .alterTable('pets')
        .addColumn('temporary_enums', sql`temp_enum[]`)
        .execute()
    })

    afterEach(async () => {
      await _db.schema.alterTable('pets').dropColumn('temporary_enums').execute()
    })

    context('behavior=replace', () => {
      it('replaces dead value with specified replaceWith, preserving other values within the enum', async () => {
        await _db
          .insertInto('pets')
          .values([
            {
              temporary_enums: ['a', 'b', 'c', 'c'],
              created_at: '2024-02-02',
            },
            {
              temporary_enums: ['a', 'c'],
              created_at: '2024-02-02',
            },
          ])
          .execute()

        await DreamMigrationHelpers.dropEnumValue(_db, {
          enumName: 'temp_enum',
          value: 'c',
          replacements: [
            {
              table: 'pets',
              column: 'temporary_enums',
              array: true,
              behavior: 'replace',
              replaceWith: 'b',
            },
          ],
        })

        const pet = await _db.selectFrom('pets').selectAll().executeTakeFirst()
        expect(pet!.temporaryEnums).toEqual('{a,b,b,b}')
        const lastPet = await _db.selectFrom('pets').orderBy('id', 'desc').selectAll().executeTakeFirst()
        expect(lastPet!.temporaryEnums).toEqual('{a,b}')
      })
    })

    context('behavior=remove', () => {
      it('removes dead value, preserving other values within the enum', async () => {
        await _db
          .insertInto('pets')
          .values([
            {
              temporary_enums: ['a', 'b', 'c'],
              created_at: '2024-02-02',
            },
            {
              temporary_enums: ['a', 'c'],
              created_at: '2024-02-02',
            },
          ])
          .execute()

        await DreamMigrationHelpers.dropEnumValue(_db, {
          enumName: 'temp_enum',
          value: 'c',
          replacements: [
            {
              table: 'pets',
              column: 'temporary_enums',
              array: true,
              behavior: 'remove',
            },
          ],
        })

        const pet = await _db.selectFrom('pets').selectAll().executeTakeFirst()
        expect(pet!.temporaryEnums).toEqual('{a,b}')
        const lastPet = await _db.selectFrom('pets').orderBy('id', 'desc').selectAll().executeTakeFirst()
        expect(lastPet!.temporaryEnums).toEqual('{a}')
      })
    })
  })
})
