import { sql } from 'kysely'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import { IntrospectedTable } from '../../../../src/types/db.js'
import testDb from '../../../helpers/testDb.js'

describe('PostgresQueryDriver.introspectDatabase', () => {
  const db = () => testDb('default', 'primary')

  beforeEach(async () => {
    await sql`
      CREATE DOMAIN chalupasdujour_introspection_email AS text;
      CREATE TYPE chalupasdujour_introspection_mood AS ENUM ('sad', 'happy');
      CREATE TABLE chalupasdujour_introspection_things (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email chalupasdujour_introspection_email NOT NULL,
        moods chalupasdujour_introspection_mood[],
        span interval,
        location point,
        area circle,
        payload bytea,
        email_length integer GENERATED ALWAYS AS (length(email)) STORED,
        flagged boolean DEFAULT false
      );
      CREATE VIEW chalupasdujour_introspection_things_view AS SELECT id, email FROM chalupasdujour_introspection_things;
      CREATE MATERIALIZED VIEW chalupasdujour_introspection_things_matview AS SELECT id FROM chalupasdujour_introspection_things;
      CREATE TABLE chalupasdujour_introspection_parted (id bigint NOT NULL, created_on date NOT NULL) PARTITION BY RANGE (created_on);
      CREATE TABLE chalupasdujour_introspection_parted_2026 PARTITION OF chalupasdujour_introspection_parted
        FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
      CREATE TABLE chalupasdujour_introspection_events (id bigint);
      CREATE TABLE chalupasdujour_introspection_events_child () INHERITS (chalupasdujour_introspection_events);
      CREATE DOMAIN chalupasdujour_introspection_level AS integer;
      CREATE DOMAIN chalupasdujour_introspection_score AS chalupasdujour_introspection_level;
      CREATE DOMAIN chalupasdujour_introspection_mood_domain AS chalupasdujour_introspection_mood;
      CREATE DOMAIN chalupasdujour_introspection_mood_domain2 AS chalupasdujour_introspection_mood_domain;
      CREATE DOMAIN chalupasdujour_introspection_day AS date;
      CREATE TABLE chalupasdujour_introspection_scores (
        score chalupasdujour_introspection_score,
        mood chalupasdujour_introspection_mood_domain2,
        days chalupasdujour_introspection_day[]
      );
      CREATE SCHEMA chalupasdujour_introspection_other;
      CREATE TYPE chalupasdujour_introspection_other.chalupasdujour_introspection_mood AS ENUM ('meh');
    `.execute(db())
  })

  afterEach(async () => {
    await sql`
      DROP SCHEMA IF EXISTS chalupasdujour_introspection_other CASCADE;
      DROP TABLE IF EXISTS chalupasdujour_introspection_scores;
      DROP DOMAIN IF EXISTS chalupasdujour_introspection_day;
      DROP DOMAIN IF EXISTS chalupasdujour_introspection_mood_domain2;
      DROP DOMAIN IF EXISTS chalupasdujour_introspection_mood_domain;
      DROP DOMAIN IF EXISTS chalupasdujour_introspection_score;
      DROP DOMAIN IF EXISTS chalupasdujour_introspection_level;
      DROP TABLE IF EXISTS chalupasdujour_introspection_events_child;
      DROP TABLE IF EXISTS chalupasdujour_introspection_events;
      DROP MATERIALIZED VIEW IF EXISTS chalupasdujour_introspection_things_matview;
      DROP VIEW IF EXISTS chalupasdujour_introspection_things_view;
      DROP TABLE IF EXISTS chalupasdujour_introspection_things;
      DROP TABLE IF EXISTS chalupasdujour_introspection_parted;
      DROP TYPE IF EXISTS chalupasdujour_introspection_mood;
      DROP DOMAIN IF EXISTS chalupasdujour_introspection_email;
    `.execute(db())
  })

  function table(tables: IntrospectedTable[], name: string) {
    return tables.find(table => table.name === name)
  }

  it('reads each column with its type, nullability and whether an insert may leave it out', async () => {
    const { tables } = await PostgresQueryDriver.introspectDatabase('default')
    const things = table(tables, 'chalupasdujour_introspection_things')!

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
        dbType: 'chalupasdujour_introspection_mood[]',
        valueType: 'enum',
        enumName: 'chalupasdujour_introspection_mood',
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

  it('reads a column of a domain, or of an array of one, as the type at the bottom of its domains', async () => {
    const { tables } = await PostgresQueryDriver.introspectDatabase('default')
    const scores = table(tables, 'chalupasdujour_introspection_scores')!

    expect(scores.columns).toEqual([
      expect.objectContaining({ name: 'score', dbType: 'integer', valueType: 'number', enumName: null }),
      expect.objectContaining({
        name: 'mood',
        dbType: 'chalupasdujour_introspection_mood',
        valueType: 'enum',
        enumName: 'chalupasdujour_introspection_mood',
      }),
      expect.objectContaining({ name: 'days', dbType: 'date[]', valueType: 'Timestamp', isArray: true }),
    ])
  })

  it('reads views, materialized views and partitioned tables, but not partitions or Kysely’s migration tables', async () => {
    const { tables } = await PostgresQueryDriver.introspectDatabase('default')
    const names = tables.map(table => table.name)

    expect(names).toEqual(
      expect.arrayContaining([
        'chalupasdujour_introspection_things_view',
        'chalupasdujour_introspection_things_matview',
        'chalupasdujour_introspection_parted',
      ])
    )
    expect(names).not.toContain('chalupasdujour_introspection_parted_2026')
    expect(names).toContain('chalupasdujour_introspection_events')
    expect(names).not.toContain('chalupasdujour_introspection_events_child')
    expect(names).not.toContain('kysely_migration')
    expect(names).not.toContain('kysely_migration_lock')
  })

  it('reads the values of each enum, naming an enum outside the public schema <schema>.<name>', async () => {
    const { enums } = await PostgresQueryDriver.introspectDatabase('default')
    const mood = enums.find(databaseEnum => databaseEnum.name === 'chalupasdujour_introspection_mood')!
    const otherMood = enums.find(
      databaseEnum =>
        databaseEnum.name === 'chalupasdujour_introspection_other.chalupasdujour_introspection_mood'
    )!

    expect([...mood.values].sort()).toEqual(['happy', 'sad'])
    expect(otherMood.values).toEqual(['meh'])
  })
})
