import InvalidDecimalFieldPassedToGenerator from '../../../src/exceptions/invalid-decimal-field-passed-to-generator'
import generateStiMigrationContent from '../../../src/helpers/cli/generateStiMigrationContent'

describe('dream generate:model <name> [...attributes]', () => {
  context('string attributes', () => {
    it('generates a kysely migration with multiple text fields', () => {
      const res = generateStiMigrationContent({
        table: 'users',
        attributes: [
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
import { Kysely, sql, CompiledQuery } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.executeQuery(CompiledQuery.raw('CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;'))
  await db.schema
    .alterTable('users')
    .addColumn('email', 'varchar(128)')
    .addColumn('name', sql\`citext\`)
    .addColumn('password_digest', 'varchar(255)')
    .addColumn('chalupified_at', 'timestamp')
    .addColumn('finished_chalupa_on', 'date')
    .addColumn('finished_chalupa_at', 'timestamp')
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
        attributes: ['deliciousness:decimal:4,2'],
        primaryKeyType: 'bigserial',
      })

      expect(res).toEqual(
        `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('chalupas')
    .addColumn('deliciousness', 'decimal(4, 2)')
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
            attributes: ['deliciousness:decimal'],
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
            attributes: ['deliciousness:decimal:4'],
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
        attributes: [
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
    .addColumn('topping', sql\`topping_enum\`)
    .addColumn('protein_type', sql\`protein_enum\`)
    .addColumn('existing_enum', sql\`my_existing_enum_enum\`)
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
        attributes: ['admin/user:belongs_to'],
        primaryKeyType: 'bigserial',
      })

      expect(res).toEqual(
        `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('compositions')
    .addColumn('admin_user_id', 'bigint', col => col.references('admin_users.id').onDelete('restrict').notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('compositions')
    .alterColumn('id')
    .alterColumn('admin_user_id')
    .alterColumn('created_at')
    .alterColumn('updated_at')
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
        attributes: ['user:belongs_to'],
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('compositions')
    .dropColumn('user_id')
    .execute()
}\
`
      )
    })
  })

  context('has_one attribute is passed', () => {
    it('ignores the attribute', () => {
      const res = generateStiMigrationContent({
        table: 'compositions',
        attributes: ['user:has_one'],
        primaryKeyType: 'uuid',
      })

      expect(res).toEqual(
        `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('compositions')
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('compositions')
    .execute()
}\
`
      )
    })
  })

  context('has_many attribute is passed', () => {
    it('ignores the attribute', () => {
      const res = generateStiMigrationContent({
        table: 'compositions',
        attributes: ['user:has_many'],
        primaryKeyType: 'uuid',
      })

      expect(res).toEqual(
        `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('compositions')
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('compositions')
    .execute()
}\
`
      )
    })
  })
})
