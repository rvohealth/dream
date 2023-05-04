import generateMigrationContent from '../../../src/helpers/cli/generateMigrationContent'

describe('dream generate:model <name> [...attributes]', () => {
  context('when provided attributes', () => {
    context('string attributes', () => {
      it('generates a kysely migration with multiple text fields', async () => {
        const res = generateMigrationContent({
          table: 'users',
          attributes: [
            'email:string',
            'name:citext',
            'password_digest:string',
            'chalupified_at:datetime',
            'finished_chalupa_on:date',
            'finished_chalupa_at:timestamp',
          ],
          useUUID: false,
        })

        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('email', 'text')
    .addColumn('name', 'citext')
    .addColumn('password_digest', 'text')
    .addColumn('chalupified_at', 'timestamp')
    .addColumn('finished_chalupa_on', 'date')
    .addColumn('finished_chalupa_at', 'timestamp')
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}\
`
        )
      })
    })

    context('enum attributes', () => {
      it('generates a kysely migration with enum', async () => {
        const res = generateMigrationContent({
          table: 'chalupas',
          attributes: [
            'topping:enum:topping(lettuce, cheese,baja sauce)',
            'protein_type:enum:protein(beef, nonbeef)',
            'existing_enum:enum:my_existing_enum',
          ],
          useUUID: false,
        })
        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('topping_enum')
    .asEnum([
      'lettuce',
      'cheese',
      'baja sauce'
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
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('topping', sql\`topping_enum\`)
    .addColumn('protein_type', sql\`protein_enum\`)
    .addColumn('existing_enum', sql\`my_existing_enum_enum\`)
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('chalupas').execute()
}\
`
        )
      })
    })

    context('belongs_to attribute is passed', () => {
      it('generates a kysely model with the belongs_to association', async () => {
        const res = generateMigrationContent({
          table: 'compositions',
          attributes: ['user:belongs_to'],
          useUUID: false,
        })

        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('compositions')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('user_id', 'bigint', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}\
`
        )
      })
    })

    context('belongs_to attribute is passed AND useUUID=false', () => {
      it('generates a kysely model with the belongs_to association', async () => {
        const res = generateMigrationContent({
          table: 'compositions',
          attributes: ['user:belongs_to'],
          useUUID: true,
        })

        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('compositions')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('user_id', 'uuid', col => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}\
`
        )
      })
    })

    context('has_one attribute is passed', () => {
      it('ignores the attribute', async () => {
        const res = generateMigrationContent({
          table: 'compositions',
          attributes: ['user:has_one'],
          useUUID: true,
        })

        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('compositions')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}\
`
        )
      })
    })

    context('has_many attribute is passed', () => {
      it('ignores the attribute', async () => {
        const res = generateMigrationContent({
          table: 'compositions',
          attributes: ['user:has_many'],
          useUUID: true,
        })

        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('compositions')
    .addColumn('id', 'uuid', col => col.primaryKey())
    .addColumn('created_at', 'timestamp', col => col.notNull())
    .addColumn('updated_at', 'timestamp', col => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}\
`
        )
      })
    })
  })
})
