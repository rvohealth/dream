import { sql } from 'kysely'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import { IntrospectedTable } from '../../../../src/types/db.js'
import testDb from '../../../helpers/testDb.js'

describe('PostgresQueryDriver.introspectDatabase', () => {
  const db = () => testDb('default', 'primary')

  beforeEach(async () => {
    await sql`
      CREATE DOMAIN zz_introspection_email AS text;
      CREATE TYPE zz_introspection_mood AS ENUM ('sad', 'happy');
      CREATE TABLE zz_introspection_things (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email zz_introspection_email NOT NULL,
        moods zz_introspection_mood[],
        span interval,
        location point,
        area circle,
        payload bytea,
        email_length integer GENERATED ALWAYS AS (length(email)) STORED,
        flagged boolean DEFAULT false
      );
      CREATE VIEW zz_introspection_things_view AS SELECT id, email FROM zz_introspection_things;
      CREATE MATERIALIZED VIEW zz_introspection_things_matview AS SELECT id FROM zz_introspection_things;
      CREATE TABLE zz_introspection_parted (id bigint NOT NULL, created_on date NOT NULL) PARTITION BY RANGE (created_on);
      CREATE TABLE zz_introspection_parted_2026 PARTITION OF zz_introspection_parted
        FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
    `.execute(db())
  })

  afterEach(async () => {
    await sql`
      DROP MATERIALIZED VIEW IF EXISTS zz_introspection_things_matview;
      DROP VIEW IF EXISTS zz_introspection_things_view;
      DROP TABLE IF EXISTS zz_introspection_things;
      DROP TABLE IF EXISTS zz_introspection_parted;
      DROP TYPE IF EXISTS zz_introspection_mood;
      DROP DOMAIN IF EXISTS zz_introspection_email;
    `.execute(db())
  })

  function table(tables: IntrospectedTable[], name: string) {
    return tables.find(table => table.name === name)
  }

  it('reads each column with its type, nullability and whether an insert may leave it out', async () => {
    const { tables } = await PostgresQueryDriver.introspectDatabase('default')
    const things = table(tables, 'zz_introspection_things')!

    expect(things).toMatchObject({ schema: 'public', inDefaultSchema: true })
    expect(things.columns).toEqual([
      {
        name: 'id',
        dbType: 'bigint',
        valueType: 'Int8',
        enumName: null,
        isArray: false,
        allowNull: false,
        hasDefault: true,
      },
      {
        name: 'email',
        dbType: 'text',
        valueType: 'string',
        enumName: null,
        isArray: false,
        allowNull: false,
        hasDefault: false,
      },
      {
        name: 'moods',
        dbType: 'zz_introspection_mood[]',
        valueType: 'enum',
        enumName: 'zz_introspection_mood',
        isArray: true,
        allowNull: true,
        hasDefault: false,
      },
      {
        name: 'span',
        dbType: 'interval',
        valueType: 'Interval',
        enumName: null,
        isArray: false,
        allowNull: true,
        hasDefault: false,
      },
      {
        name: 'location',
        dbType: 'point',
        valueType: 'Point',
        enumName: null,
        isArray: false,
        allowNull: true,
        hasDefault: false,
      },
      {
        name: 'area',
        dbType: 'circle',
        valueType: 'Circle',
        enumName: null,
        isArray: false,
        allowNull: true,
        hasDefault: false,
      },
      {
        name: 'payload',
        dbType: 'bytea',
        valueType: 'Buffer',
        enumName: null,
        isArray: false,
        allowNull: true,
        hasDefault: false,
      },
      {
        name: 'email_length',
        dbType: 'integer',
        valueType: 'number',
        enumName: null,
        isArray: false,
        allowNull: true,
        hasDefault: true,
      },
      {
        name: 'flagged',
        dbType: 'boolean',
        valueType: 'boolean',
        enumName: null,
        isArray: false,
        allowNull: true,
        hasDefault: true,
      },
    ])
  })

  it('reads views, materialized views and partitioned tables, but not partitions or Kysely’s migration tables', async () => {
    const { tables } = await PostgresQueryDriver.introspectDatabase('default')
    const names = tables.map(table => table.name)

    expect(names).toEqual(
      expect.arrayContaining([
        'zz_introspection_things_view',
        'zz_introspection_things_matview',
        'zz_introspection_parted',
      ])
    )
    expect(names).not.toContain('zz_introspection_parted_2026')
    expect(names).not.toContain('kysely_migration')
    expect(names).not.toContain('kysely_migration_lock')
  })

  it('reads the values of each enum', async () => {
    const { enums } = await PostgresQueryDriver.introspectDatabase('default')
    const mood = enums.find(databaseEnum => databaseEnum.name === 'zz_introspection_mood')!

    expect([...mood.values].sort()).toEqual(['happy', 'sad'])
  })
})
