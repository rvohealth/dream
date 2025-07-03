// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

const UNIQUE_CONSTRAINT_VIOLATION = 'UNIQUE_CONSTRAINT_VIOLATION'
const INVALID_INPUT_SYNTAX = 'INVALID_INPUT_SYNTAX'

export const PG_ERRORS = {
  '23505': UNIQUE_CONSTRAINT_VIOLATION,
  '22P02': INVALID_INPUT_SYNTAX,
  '22007': INVALID_INPUT_SYNTAX,
} as const

type PgErrorType = (typeof PG_ERRORS)[keyof typeof PG_ERRORS]

function pgErrorFromCode(code: string | undefined): PgErrorType | null {
  return PG_ERRORS[code! as unknown as keyof typeof PG_ERRORS] || null
}

export function pgErrorType(error: any): PgErrorType | null {
  if (error instanceof pg.DatabaseError) return pgErrorFromCode(error.code)
  return null
}
