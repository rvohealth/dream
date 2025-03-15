import { Kysely, sql } from 'kysely'
import { db } from '../../../../src.js'
import DreamMigrationHelpers from '../../../../src/db/migration-helpers/DreamMigrationHelpers.js'

describe('DreamMigrationHelpers.dropEnumValue', () => {
  let _db: Kysely<any>

  beforeEach(async () => {
    _db = db('primary')
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
