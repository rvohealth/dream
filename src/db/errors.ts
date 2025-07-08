// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

export const CHECK_VIOLATION = 'CHECK_VIOLATION'
export const FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION'
export const INTEGRITY_CONSTRAINT_VIOLATION = 'INTEGRITY_CONSTRAINT_VIOLATION'
export const INVALID_INPUT_SYNTAX = 'INVALID_INPUT_SYNTAX'
export const NOT_NULL_VIOLATION = 'NOT_NULL_VIOLATION'
export const RESTRICT_VIOLATION = 'RESTRICT_VIOLATION'
export const UNIQUE_VIOLATION = 'UNIQUE_VIOLATION'

export const PG_ERRORS = {
  '23505': UNIQUE_VIOLATION,

  '22007': INVALID_INPUT_SYNTAX,
  '22P02': INVALID_INPUT_SYNTAX,

  '23502': NOT_NULL_VIOLATION,
  '23514': CHECK_VIOLATION,

  '23000': INTEGRITY_CONSTRAINT_VIOLATION,
  '23001': RESTRICT_VIOLATION,
  '23503': FOREIGN_KEY_VIOLATION,
} as const

type PgErrorType = (typeof PG_ERRORS)[keyof typeof PG_ERRORS]

function pgErrorFromCode(code: string | undefined): PgErrorType | null {
  return PG_ERRORS[code! as unknown as keyof typeof PG_ERRORS] || null
}

export function pgErrorType(error: any): PgErrorType | null {
  if (error instanceof pg.DatabaseError) return pgErrorFromCode(error.code)
  return null
}
