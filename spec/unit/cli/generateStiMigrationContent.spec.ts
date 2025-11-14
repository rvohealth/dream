import InvalidDecimalFieldPassedToGenerator from '../../../src/errors/InvalidDecimalFieldPassedToGenerator.js'
import generateStiMigrationContent from '../../../src/helpers/cli/generateStiMigrationContent.js'

describe('dream generate:model <name> [...attributes]', () => {
  context('string attributes', () => {
    it('generates a kysely migration with multiple text fields (email is always generated as citext and unique)', () => {
      const res = generateStiMigrationContent({
        table: 'users',
        columnsWithTypes: [
          'email:string:128',
          'name:citext',
          'password_digest:string',
          'chalupified_at:datetime',
          'finished_chalupa_on:date',
          'finished_chalupa_at:timestamp',
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
    .alterTable('users')
    .addColumn('email', sql\`citext\`, col => col.notNull().unique())
    .addColumn('name', sql\`citext\`, col => col.notNull())
    .addColumn('password_digest', 'varchar(255)', col => col.notNull())
    .addColumn('chalupified_at', 'timestamp', col => col.notNull())
    .addColumn('finished_chalupa_on', 'date', col => col.notNull())
    .addColumn('finished_chalupa_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropColumn('email')
    .dropColumn('name')
    .dropColumn('password_digest')
    .dropColumn('chalupified_at')
    .dropColumn('finished_chalupa_on')
    .dropColumn('finished_chalupa_at')
    .execute()
}\
`
      )
    })
  })

  context('decimal attributes', () => {
    it('generates a kysely migration with decimal field', () => {
      const res = generateStiMigrationContent({
        table: 'chalupas',
        columnsWithTypes: ['deliciousness:decimal:4,2'],
        primaryKeyType: 'bigserial',
      })

      expect(res).toEqual(
        `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('chalupas')
    .addColumn('deliciousness', 'decimal(4, 2)', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('chalupas')
    .dropColumn('deliciousness')
    .execute()
}\
`
      )
    })

    context('scale and precision are missing', () => {
      it('raises an exception', () => {
        expect(() => {
          generateStiMigrationContent({
            table: 'chalupas',
            columnsWithTypes: ['deliciousness:decimal'],
            primaryKeyType: 'bigserial',
          })
        }).toThrow(InvalidDecimalFieldPassedToGenerator)
      })
    })

    context('only precision is missing', () => {
      it('raises an exception', () => {
        expect(() => {
          generateStiMigrationContent({
            table: 'chalupas',
            columnsWithTypes: ['deliciousness:decimal:4'],
            primaryKeyType: 'bigserial',
          })
        }).toThrow(InvalidDecimalFieldPassedToGenerator)
      })
    })
  })

  context('enum attributes', () => {
    it('generates a kysely migration with enum', () => {
      const res = generateStiMigrationContent({
        table: 'chalupas',
        columnsWithTypes: [
          'topping:enum:topping:lettuce,cheese,baja_sauce',
          'protein_type:enum:protein:beef,nonbeef',
          'existing_enum:enum:my_existing_enum',
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
    .alterTable('chalupas')
    .addColumn('topping', sql\`topping_enum\`, col => col.notNull())
    .addColumn('protein_type', sql\`protein_enum\`, col => col.notNull())
    .addColumn('existing_enum', sql\`my_existing_enum_enum\`, col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('chalupas')
    .dropColumn('topping')
    .dropColumn('protein_type')
    .dropColumn('existing_enum')
    .execute()

  await db.schema.dropType('topping_enum').execute()
  await db.schema.dropType('protein_enum').execute()
}\
`
      )
    })
  })

  context('belongs_to attribute is passed', () => {
    it('generates a kysely model with the belongsTo association', () => {
      const res = generateStiMigrationContent({
        table: 'compositions',
        columnsWithTypes: ['music/score:belongs_to'],
        primaryKeyType: 'bigserial',
      })

      expect(res).toEqual(
        `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('compositions')
    .addColumn('score_id', 'bigint', col => col.references('music_scores.id').onDelete('restrict').notNull())
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
  await db.schema
    .alterTable('compositions')
    .dropColumn('score_id')
    .execute()
}\
`
      )
    })
  })

  context('belongs_to attribute is passed AND useUUID=false', () => {
    it('generates a kysely model with the belongsTo association', () => {
      const res = generateStiMigrationContent({
        table: 'compositions',
        columnsWithTypes: ['user:belongs_to'],
        primaryKeyType: 'uuid',
      })

      expect(res).toEqual(
        `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('compositions')
    .addColumn('user_id', 'uuid', col => col.references('users.id').onDelete('restrict').notNull())
    .execute()

  await db.schema
    .createIndex('compositions_user_id')
    .on('compositions')
    .column('user_id')
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('compositions_user_id').execute()
  await db.schema
    .alterTable('compositions')
    .dropColumn('user_id')
    .execute()
}\
`
      )
    })
  })
})
