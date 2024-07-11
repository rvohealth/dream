import InvalidDecimalFieldPassedToGenerator from '../../../src/exceptions/invalid-decimal-field-passed-to-generator'
import generateMigrationContent from '../../../src/helpers/cli/generateMigrationContent'

describe('dream generate:model <name> [...attributes]', () => {
  context('with no attributes', () => {
    it('generates a migration with no columns', () => {
      const res = generateMigrationContent({
        table: 'users',
        attributes: [],
        primaryKeyType: 'bigserial',
      })
      expect(res).toEqual(`\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}`)
    })
  })

  context('when provided attributes', () => {
    context('string attributes', () => {
      it('generates a kysely migration with multiple text fields', () => {
        const res = generateMigrationContent({
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

    context('decimal attributes', () => {
      it('generates a kysely migration with decimal field', () => {
        const res = generateMigrationContent({
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
              attributes: ['deliciousness:decimal'],
              primaryKeyType: 'bigserial',
            })
          }).toThrowError(InvalidDecimalFieldPassedToGenerator)
        })
      })

      context('only precision is missing', () => {
        it('raises an exception', () => {
          expect(() => {
            generateMigrationContent({
              table: 'chalupas',
              attributes: ['deliciousness:decimal:4'],
              primaryKeyType: 'bigserial',
            })
          }).toThrowError(InvalidDecimalFieldPassedToGenerator)
        })
      })
    })

    context('enum attributes', () => {
      it('generates a kysely migration with enum', () => {
        const res = generateMigrationContent({
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

    context('belongs_to attribute is passed', () => {
      it('generates a kysely model with the belongsTo association', () => {
        const res = generateMigrationContent({
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
    .createTable('compositions')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('admin_user_id', 'bigint', col => col.references('admin_users.id').onDelete('restrict').notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}\
`
        )
      })
    })

    context('belongs_to attribute is passed AND useUUID=false', () => {
      it('generates a kysely model with the belongsTo association', () => {
        const res = generateMigrationContent({
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
    .createTable('compositions')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('user_id', 'uuid', col => col.references('users.id').onDelete('restrict').notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}\
`
        )
      })
    })

    context('has_one attribute is passed', () => {
      it('ignores the attribute', () => {
        const res = generateMigrationContent({
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
    .createTable('compositions')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}\
`
        )
      })
    })

    context('has_many attribute is passed', () => {
      it('ignores the attribute', () => {
        const res = generateMigrationContent({
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
    .createTable('compositions')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}\
`
        )
      })
    })
  })
})
