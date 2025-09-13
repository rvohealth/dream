import InvalidDecimalFieldPassedToGenerator from '../../../src/errors/InvalidDecimalFieldPassedToGenerator.js'
import generateMigrationContent from '../../../src/helpers/cli/generateMigrationContent.js'

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
    .addColumn('greeting', 'varchar(255)', col => col.notNull())
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

  context('stiChildClassName', () => {
    it('creates a check constraint rather than notNull', () => {
      const res = generateMigrationContent({
        table: 'rooms',
        columnsWithTypes: ['hello:string', 'world:integer'],
        primaryKeyType: 'bigserial',
        createOrAlter: 'alter',
        stiChildClassName: 'RoomsLivingRoom',
      })
      expect(res).toEqual(`\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('rooms')
    .addColumn('hello', 'varchar(255)')
    .addColumn('world', 'integer')
    .execute()

  await db.schema
    .alterTable('rooms')
    .addCheckConstraint(
      'rooms_not_null_hello',
      sql\`type != 'RoomsLivingRoom' OR hello IS NOT NULL\`,
    )
    .execute()

  await db.schema
    .alterTable('rooms')
    .addCheckConstraint(
      'rooms_not_null_world',
      sql\`type != 'RoomsLivingRoom' OR world IS NOT NULL\`,
    )
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('rooms')
    .dropColumn('hello')
    .dropColumn('world')
    .execute()
}`)
    })

    context('optional columns', () => {
      it('omit the check constraint', () => {
        const res = generateMigrationContent({
          table: 'rooms',
          columnsWithTypes: ['hello:string:optional'],
          primaryKeyType: 'bigserial',
          createOrAlter: 'alter',
          stiChildClassName: 'RoomsLivingRoom',
        })
        expect(res).toEqual(`\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('rooms')
    .addColumn('hello', 'varchar(255)')
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('rooms')
    .dropColumn('hello')
    .execute()
}`)
      })
    })
  })

  context('with no attributes', () => {
    it('generates a migration with only primary key, created_at, and updated_at columns', () => {
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
import { DreamMigrationHelpers } from '@rvoh/dream'
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await DreamMigrationHelpers.createExtension(db, 'citext')

  await db.schema
    .createTable('users')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('email', 'varchar(128)', col => col.notNull())
    .addColumn('name', sql\`citext\`, col => col.notNull())
    .addColumn('password_digest', 'varchar(255)', col => col.notNull())
    .addColumn('chalupified_at', 'timestamp', col => col.notNull())
    .addColumn('finished_chalupa_on', 'date', col => col.notNull())
    .addColumn('finished_chalupa_at', 'timestamp', col => col.notNull())
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
    .addColumn('phone_number', 'varchar(255)', col => col.notNull())
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
    .addColumn('encrypted_phone_number', 'text', col => col.notNull())
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
    .addColumn('deliciousness', 'decimal(4, 2)', col => col.notNull())
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

    context('array attributes', () => {
      it('generates array column statements', () => {
        const res = generateMigrationContent({
          table: 'chalupas',
          columnsWithTypes: [
            'name:text[]',
            'phone_number:string[]',
            'deliciousness:decimal[]:4,2',
            'my_bools:boolean[]',
            'my_dates:date[]',
            'my_datetimes:datetime[]',
          ],
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
    .addColumn('name', sql\`text[]\`, col => col.notNull().defaultTo('{}'))
    .addColumn('phone_number', sql\`varchar(255)[]\`, col => col.notNull().defaultTo('{}'))
    .addColumn('deliciousness', sql\`decimal(4, 2)[]\`, col => col.notNull().defaultTo('{}'))
    .addColumn('my_bools', sql\`boolean[]\`, col => col.notNull().defaultTo('{}'))
    .addColumn('my_dates', sql\`date[]\`, col => col.notNull().defaultTo('{}'))
    .addColumn('my_datetimes', sql\`datetime[]\`, col => col.notNull().defaultTo('{}'))
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
    })

    context('enum attributes', () => {
      it('generates a kysely migration with non-null enum', () => {
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
    .addColumn('topping', sql\`topping_enum\`, col => col.notNull())
    .addColumn('protein_type', sql\`protein_enum\`, col => col.notNull())
    .addColumn('existing_enum', sql\`my_existing_enum_enum\`, col => col.notNull())
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

      context('enum[] attributes', () => {
        it('generates a kysely migration with non-null enum', () => {
          const res = generateMigrationContent({
            table: 'chalupas',
            columnsWithTypes: [
              'topping:enum[]:topping:lettuce,cheese,baja_sauce',
              'protein_type:enum[]:protein:beef,nonbeef',
              'existing_enum:enum[]:my_existing_enum',
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
    .addColumn('topping', sql\`topping_enum[]\`, col => col.notNull().defaultTo('{}'))
    .addColumn('protein_type', sql\`protein_enum[]\`, col => col.notNull().defaultTo('{}'))
    .addColumn('existing_enum', sql\`my_existing_enum_enum[]\`, col => col.notNull().defaultTo('{}'))
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
    })

    context('"type" enum column', () => {
      it('is non-nullable, and includes index', () => {
        const res = generateMigrationContent({
          table: 'balloons',
          columnsWithTypes: ['type:enum:balloon_types:Mylar,Latex'],
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
    .addColumn('type', sql\`balloon_types_enum\`, col => col.notNull())
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

    context('"type" string column', () => {
      it('includes a comment suggesting use of an enum', () => {
        const res = generateMigrationContent({
          table: 'balloons',
          columnsWithTypes: ['type:string'],
          primaryKeyType: 'bigserial',
        })
        expect(res).toEqual(
          `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('balloons')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    // CONSIDER: when using type for STI, always use an enum
    // Try using the enum syntax in your generator, e.g.:
    // yarn psy g:model Balloon type:enum:balloon_type:latex,mylar
    .addColumn('type', 'varchar(255)', col => col.notNull())
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
}\
`
        )
      })
    })

    context('belongs_to attribute', () => {
      it('generates a kysely model with the belongsTo association', () => {
        const res = generateMigrationContent({
          table: 'compositions',
          columnsWithTypes: ['Music/Score:belongs_to'],
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
    .addColumn('score_id', 'bigint', col => col.references('music_scores.id').onDelete('restrict').notNull())
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('compositions').execute()
}\
`
          )
        })
      })

      context('when useUUID=true', () => {
        it('generates a kysely model with the belongsTo association, providing correct usage of uuid in each case', () => {
          const res = generateMigrationContent({
            table: 'compositions',
            columnsWithTypes: ['user:belongs_to', 'some_uuid:uuid'],
            primaryKeyType: 'uuid',
          })

          expect(res).toEqual(
            `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('compositions')
    .addColumn('id', 'uuid', col =>
      col
        .primaryKey()
        .defaultTo(sql\`uuid_generate_v4()\`),
    )
    .addColumn('user_id', 'uuid', col => col.references('users.id').onDelete('restrict').notNull())
    .addColumn('some_uuid', 'uuid', col => col.notNull())
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
    .addColumn('id', 'uuid', col =>
      col
        .primaryKey()
        .defaultTo(sql\`uuid_generate_v4()\`),
    )
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
    .addColumn('id', 'uuid', col =>
      col
        .primaryKey()
        .defaultTo(sql\`uuid_generate_v4()\`),
    )
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
