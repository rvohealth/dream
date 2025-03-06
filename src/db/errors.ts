import * as pg from 'pg'

const { DatabaseError } = pg

export const PG_ERRORS = {
  23505: 'UNIQUE_CONSTRAINT_VIOLATION',
} as const

type PgErrorType = (typeof PG_ERRORS)[keyof typeof PG_ERRORS]

function pgErrorFromCode(code: string | undefined): PgErrorType | null {
  return PG_ERRORS[code! as unknown as keyof typeof PG_ERRORS] || null
}

export function pgErrorType(error: any): PgErrorType | null {
  if (error instanceof DatabaseError) return pgErrorFromCode(error.code)
  return null
}
