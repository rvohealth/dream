import InvalidDecimalFieldPassedToGenerator from '../../../src/exceptions/InvalidDecimalFieldPassedToGenerator'
import generateMigrationContent from '../../../src/helpers/cli/generateMigrationContent'

describe('generateMigrationContent', () => {
  context('createOrAlter: true', () => {
    it('generates a migration with an alterTable syntax', () => {
      const res = generateMigrationContent({
        table: 'hello_worlds',
        columnsWithTypes: ['greeting:string'],
        primaryKeyType: 'bigserial',
        createOrAlter: 'alter',
      })
      expect(res).toEqual(`\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('hello_worlds')
    .addColumn('greeting', 'varchar(255)')
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('hello_worlds')
    .dropColumn('greeting')
    .execute()
}`)
    })
  })

  context('with no attributes', () => {
    it('generates a migration with no columns', () => {
      const res = generateMigrationContent({
        table: 'users',
        columnsWithTypes: [],
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
import { DreamMigrationHelpers } from '@rvohealth/dream'
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

    context('columns written in camelcase', () => {
      it('are converted to snakecase', () => {
        const res = generateMigrationContent({
          table: 'users',
          columnsWithTypes: ['phoneNumber:string'],
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
    .addColumn('phone_number', 'varchar(255)')
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
          columnsWithTypes: ['phone_number:encrypted'],
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
          columnsWithTypes: ['sms_marketing:boolean'],
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
    .addColumn('sms_marketing', 'boolean', col => col.notNull().defaultTo(false))
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
          columnsWithTypes: ['deliciousness:decimal:4,2'],
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
              columnsWithTypes: ['deliciousness:decimal'],
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
              columnsWithTypes: ['deliciousness:decimal:4'],
              primaryKeyType: 'bigserial',
            })
          }).toThrow(InvalidDecimalFieldPassedToGenerator)
        })
      })
    })

    context('enum attributes', () => {
      it('generates a kysely migration with enum', () => {
        const res = generateMigrationContent({
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

    context('belongs_to attribute', () => {
      it('generates a kysely model with the belongsTo association', () => {
        const res = generateMigrationContent({
          table: 'compositions',
          columnsWithTypes: ['admin/user:belongs_to'],
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

      context('when optional is included', () => {
        it('omits notNull', () => {
          const res = generateMigrationContent({
            table: 'compositions',
            columnsWithTypes: ['admin/user:belongs_to:optional'],
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
    .addColumn('admin_user_id', 'bigint', col => col.references('admin_users.id').onDelete('restrict'))
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

      context('when useUUID=false', () => {
        it('generates a kysely model with the belongsTo association', () => {
          const res = generateMigrationContent({
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
    })

    context('has_one attribute is passed', () => {
      it('ignores the attribute', () => {
        const res = generateMigrationContent({
          table: 'compositions',
          columnsWithTypes: ['user:has_one'],
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
          columnsWithTypes: ['user:has_many'],
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
