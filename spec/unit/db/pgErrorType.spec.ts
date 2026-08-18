import { Kysely, sql } from 'kysely'
import pg from 'pg'
import {
  CHECK_VIOLATION,
  COLUMN_OVERFLOW,
  FOREIGN_KEY_VIOLATION,
  INTEGRITY_CONSTRAINT_VIOLATION,
  INVALID_INPUT_SYNTAX,
  LOCK_NOT_AVAILABLE,
  NOT_NULL_VIOLATION,
  PG_ERRORS,
  pgErrorType,
  RESTRICT_VIOLATION,
  UNIQUE_VIOLATION,
} from '../../../src/db/errors.js'
import db from '../../../test-app/db/index.js'

describe('pgErrorType', () => {
  const databaseErrorWithCode = (code: string) => {
    const error = new pg.DatabaseError('database error', 0, 'error')
    error.code = code
    return error
  }

  context('every code in the PG_ERRORS map', () => {
    // table-driven so that adding a code to PG_ERRORS without teaching
    // pgErrorType about it fails here
    Object.entries(PG_ERRORS).forEach(([code, errorType]) => {
      it(`maps ${code} to ${errorType}`, () => {
        expect(pgErrorType(databaseErrorWithCode(code))).toEqual(errorType)
      })
    })

    it('covers each of the error types Dream distinguishes', () => {
      expect(new Set(Object.values(PG_ERRORS))).toEqual(
        new Set([
          CHECK_VIOLATION,
          COLUMN_OVERFLOW,
          FOREIGN_KEY_VIOLATION,
          INTEGRITY_CONSTRAINT_VIOLATION,
          INVALID_INPUT_SYNTAX,
          LOCK_NOT_AVAILABLE,
          NOT_NULL_VIOLATION,
          RESTRICT_VIOLATION,
          UNIQUE_VIOLATION,
        ])
      )
    })
  })

  context('errors raised by the database', () => {
    let _db: Kysely<any>

    const PARENT_TABLE = 'temp_pg_error_parents'
    const CHILD_TABLE = 'temp_pg_error_children'

    beforeEach(async () => {
      _db = db('default', 'primary')

      await sql`
        CREATE TABLE ${sql.ref(PARENT_TABLE)} (
          id serial PRIMARY KEY,
          name varchar(3) UNIQUE NOT NULL
        )
      `.execute(_db)

      await sql`
        CREATE TABLE ${sql.ref(CHILD_TABLE)} (
          id serial PRIMARY KEY,
          parent_id integer REFERENCES ${sql.ref(PARENT_TABLE)} (id),
          amount integer CHECK (amount > 0),
          due_at timestamp,
          ratio numeric(3, 0)
        )
      `.execute(_db)

      await sql`INSERT INTO ${sql.ref(PARENT_TABLE)} (name) VALUES ('abc')`.execute(_db)
    })

    afterEach(async () => {
      await sql`DROP TABLE IF EXISTS ${sql.ref(CHILD_TABLE)} CASCADE`.execute(_db)
      await sql`DROP TABLE IF EXISTS ${sql.ref(PARENT_TABLE)} CASCADE`.execute(_db)
    })

    const errorFromStatement = async (statement: { execute: (db: Kysely<any>) => Promise<unknown> }) => {
      try {
        await statement.execute(_db)
      } catch (error) {
        return error
      }
      throw new Error('expected the statement to raise a database error, but it succeeded')
    }

    context('string data right truncation', () => {
      it('is a COLUMN_OVERFLOW', async () => {
        const error = await errorFromStatement(
          sql`INSERT INTO ${sql.ref(PARENT_TABLE)} (name) VALUES ('abcd')`
        )

        expect(pgErrorType(error)).toEqual(COLUMN_OVERFLOW)
      })
    })

    context('numeric value out of range', () => {
      it('is a COLUMN_OVERFLOW', async () => {
        const error = await errorFromStatement(
          sql`INSERT INTO ${sql.ref(CHILD_TABLE)} (ratio) VALUES (99999)`
        )

        expect(pgErrorType(error)).toEqual(COLUMN_OVERFLOW)
      })
    })

    context('invalid datetime format', () => {
      it('is an INVALID_INPUT_SYNTAX', async () => {
        const error = await errorFromStatement(
          sql`INSERT INTO ${sql.ref(CHILD_TABLE)} (due_at) VALUES ('not a timestamp')`
        )

        expect(pgErrorType(error)).toEqual(INVALID_INPUT_SYNTAX)
      })
    })

    context('invalid text representation', () => {
      it('is an INVALID_INPUT_SYNTAX', async () => {
        const error = await errorFromStatement(
          sql`INSERT INTO ${sql.ref(CHILD_TABLE)} (amount) VALUES ('not an integer')`
        )

        expect(pgErrorType(error)).toEqual(INVALID_INPUT_SYNTAX)
      })
    })

    context('not null violation', () => {
      it('is a NOT_NULL_VIOLATION', async () => {
        const error = await errorFromStatement(sql`INSERT INTO ${sql.ref(PARENT_TABLE)} (name) VALUES (NULL)`)

        expect(pgErrorType(error)).toEqual(NOT_NULL_VIOLATION)
      })
    })

    context('unique violation', () => {
      it('is a UNIQUE_VIOLATION', async () => {
        const error = await errorFromStatement(
          sql`INSERT INTO ${sql.ref(PARENT_TABLE)} (name) VALUES ('abc')`
        )

        expect(pgErrorType(error)).toEqual(UNIQUE_VIOLATION)
      })
    })

    context('foreign key violation', () => {
      it('is a FOREIGN_KEY_VIOLATION', async () => {
        const error = await errorFromStatement(
          sql`INSERT INTO ${sql.ref(CHILD_TABLE)} (parent_id) VALUES (-1)`
        )

        expect(pgErrorType(error)).toEqual(FOREIGN_KEY_VIOLATION)
      })

      it('is a FOREIGN_KEY_VIOLATION when deleting a referenced row', async () => {
        await sql`
          INSERT INTO ${sql.ref(CHILD_TABLE)} (parent_id, amount)
          SELECT id, 1 FROM ${sql.ref(PARENT_TABLE)}
        `.execute(_db)

        const error = await errorFromStatement(sql`DELETE FROM ${sql.ref(PARENT_TABLE)}`)

        expect(pgErrorType(error)).toEqual(FOREIGN_KEY_VIOLATION)
      })
    })

    context('check constraint violation', () => {
      it('is a CHECK_VIOLATION', async () => {
        const error = await errorFromStatement(sql`INSERT INTO ${sql.ref(CHILD_TABLE)} (amount) VALUES (-1)`)

        expect(pgErrorType(error)).toEqual(CHECK_VIOLATION)
      })
    })

    context('a statement cancelled by its lock timeout', () => {
      it('is a LOCK_NOT_AVAILABLE', async () => {
        // an advisory key nothing else in the suite derives
        const lockKey = 736_251
        let error: unknown

        await _db.transaction().execute(async holder => {
          await sql`select pg_advisory_xact_lock(${lockKey})`.execute(holder)

          error = await _db
            .transaction()
            .execute(async waiter => {
              await sql`select set_config('lock_timeout', '250', true)`.execute(waiter)
              await sql`select pg_advisory_xact_lock(${lockKey})`.execute(waiter)
            })
            .then(() => null)
            .catch((waitError: unknown) => waitError)
        })

        expect(pgErrorType(error)).toEqual(LOCK_NOT_AVAILABLE)
      })
    })

    context('an error Dream does not classify', () => {
      it('returns null', async () => {
        const error = await errorFromStatement(sql`SELECT * FROM temp_pg_error_nonexistent_table`)

        expect(pgErrorType(error)).toBeNull()
      })
    })
  })

  context('when passed something that is not a database error', () => {
    it('returns null for a plain Error', () => {
      expect(pgErrorType(new Error('not a database error'))).toBeNull()
    })

    it('returns null for a non-DatabaseError object that happens to carry a pg error code', () => {
      expect(pgErrorType({ code: '23505' })).toBeNull()
    })

    it('returns null for null', () => {
      expect(pgErrorType(null)).toBeNull()
    })

    it('returns null for undefined', () => {
      expect(pgErrorType(undefined)).toBeNull()
    })
  })

  context('when the database error carries no code', () => {
    it('returns null', () => {
      expect(pgErrorType(new pg.DatabaseError('database error', 0, 'error'))).toBeNull()
    })
  })
})
