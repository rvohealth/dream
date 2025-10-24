import InvalidDecimalFieldPassedToGenerator from '../../../src/errors/InvalidDecimalFieldPassedToGenerator.js'
import generateMigrationContent from '../../../src/helpers/cli/generateMigrationContent.js'

describe('generateMigrationContent with optional', () => {
  context('when provided attributes', () => {
    context('string attributes', () => {
      it('generates a kysely migration with multiple text fields', () => {
        const res = generateMigrationContent({
          table: 'users',
          columnsWithTypes: [
            'email:string:128:optional',
            'name:citext:optional',
            'password_digest:string:optional',
            'chalupified_at:datetime:optional',
            'finished_chalupa_on:date:optional',
            'finished_chalupa_at:timestamp:optional',
          ],
          primaryKeyType: 'bigserial',
        })

        expect(res).toEqual(
          `\
import { DreamMigrationHelpers } from '@rvoh/dream/db'
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.createExtension(db, 'citext')

  await db.schema
    .createTable('users')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('email', 'varchar(128)')
    .addColumn('name', sql\`citext\`)
    .addColumn('password_digest', 'varchar(255)')
    .addColumn('chalupified_at', 'timestamp')
    .addColumn('finished_chalupa_on', 'date')
    .addColumn('finished_chalupa_at', 'timestamp')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}\
`
        )
      })
    })

    context('encrypted attribute', () => {
      it('generates a kysely migration with multiple text fields', () => {
        const res = generateMigrationContent({
          table: 'users',
          columnsWithTypes: ['phone_number:encrypted:optional'],
          primaryKeyType: 'bigserial',
        })

        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('encrypted_phone_number', 'text')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}\
`
        )
      })
    })

    context('boolean attributes', () => {
      it('sets not null and defaults to false', () => {
        const res = generateMigrationContent({
          table: 'communication_preferences',
          columnsWithTypes: ['sms_marketing:boolean:optional'],
          primaryKeyType: 'bigserial',
        })

        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('communication_preferences')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('sms_marketing', 'boolean')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('communication_preferences').execute()
}\
`
        )
      })
    })

    context('decimal attributes', () => {
      it('generates a kysely migration with decimal field', () => {
        const res = generateMigrationContent({
          table: 'chalupas',
          columnsWithTypes: ['deliciousness:decimal:4,2:optional'],
          primaryKeyType: 'bigserial',
        })

        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('chalupas')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('deliciousness', 'decimal(4, 2)')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('chalupas').execute()
}\
`
        )
      })

      context('scale and precision are missing', () => {
        it('raises an exception', () => {
          expect(() => {
            generateMigrationContent({
              table: 'chalupas',
              columnsWithTypes: ['deliciousness:decimal:optional'],
              primaryKeyType: 'bigserial',
            })
          }).toThrow(InvalidDecimalFieldPassedToGenerator)
        })
      })

      context('only precision is missing', () => {
        it('raises an exception', () => {
          expect(() => {
            generateMigrationContent({
              table: 'chalupas',
              columnsWithTypes: ['deliciousness:decimal:4:optional'],
              primaryKeyType: 'bigserial',
            })
          }).toThrow(InvalidDecimalFieldPassedToGenerator)
        })
      })
    })

    context('enum attributes', () => {
      it('generates a kysely migration with nullable enum', () => {
        const res = generateMigrationContent({
          table: 'chalupas',
          columnsWithTypes: [
            'topping:enum:topping:lettuce,cheese,baja_sauce:optional',
            'protein_type:enum:protein:beef,nonbeef:optional',
            'existing_enum:enum:my_existing_enum:optional',
          ],
          primaryKeyType: 'bigserial',
        })
        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('topping_enum')
    .asEnum([
      'lettuce',
      'cheese',
      'baja_sauce'
    ])
    .execute()

  await db.schema
    .createType('protein_enum')
    .asEnum([
      'beef',
      'nonbeef'
    ])
    .execute()

  await db.schema
    .createTable('chalupas')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('topping', sql\`topping_enum\`)
    .addColumn('protein_type', sql\`protein_enum\`)
    .addColumn('existing_enum', sql\`my_existing_enum_enum\`)
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('chalupas').execute()

  await db.schema.dropType('topping_enum').execute()
  await db.schema.dropType('protein_enum').execute()
}\
`
        )
      })
    })

    context('"type" enum column', () => {
      it('is non-nullable, and includes index', () => {
        const res = generateMigrationContent({
          table: 'balloons',
          columnsWithTypes: ['type:enum:balloon_types:Mylar,Latex:optional'],
          primaryKeyType: 'bigserial',
        })
        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('balloon_types_enum')
    .asEnum([
      'Mylar',
      'Latex'
    ])
    .execute()

  await db.schema
    .createTable('balloons')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('type', sql\`balloon_types_enum\`)
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await db.schema
    .createIndex('balloons_type')
    .on('balloons')
    .column('type')
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('balloons_type').execute()
  await db.schema.dropTable('balloons').execute()

  await db.schema.dropType('balloon_types_enum').execute()
}\
`
        )
      })
    })

    context('belongs_to attribute', () => {
      it('omits notNull', () => {
        const res = generateMigrationContent({
          table: 'compositions',
          columnsWithTypes: ['music/score:belongs_to:optional'],
          primaryKeyType: 'bigserial',
        })

        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('compositions')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('score_id', 'bigint', col => col.references('music_scores.id').onDelete('restrict'))
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()

  await db.schema
    .createIndex('compositions_score_id')
    .on('compositions')
    .column('score_id')
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('compositions_score_id').execute()
  await db.schema.dropTable('compositions').execute()
}\
`
        )
      })
    })
  })
})
