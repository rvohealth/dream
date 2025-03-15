import InvalidTableAlias from '../../errors/InvalidTableAlias.js.js'

export default function validateTableAlias(tableAlias: string) {
  if (!/^[a-zA-Z0-9_]*$/.test(tableAlias) || SINGLE_WORD_SQL_KEYWORDS.includes(tableAlias.toUpperCase()))
    throw new InvalidTableAlias(tableAlias)

  return tableAlias
}

const SINGLE_WORD_SQL_KEYWORDS = [
  'ADD',
  'ALL',
  'ALTER',
  'AND',
  'ANY',
  'AS',
  'ASC',
  'BACKUP',
  'BETWEEN',
  'CASE',
  'CHECK',
  'COLUMN',
  'CONSTRAINT',
  'CREATE',
  'DATABASE',
  'DEFAULT',
  'DELETE',
  'DESC',
  'DISTINCT',
  'DROP',
  'EXEC',
  'EXISTS',
  'FROM',
  'HAVING',
  'IN',
  'INDEX',
  'JOIN',
  'LIKE',
  'LIMIT',
  'NOT',
  'OR',
  'PROCEDURE',
  'ROWNUM',
  'SELECT',
  'SET',
  'TABLE',
  'TOP',
  'TRUNCATE',
  'UNION',
  'UNIQUE',
  'UPDATE',
  'VALUES',
  'VIEW',
  'WHERE',
]
