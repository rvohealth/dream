import '../helpers/loadEnv'
import { Kysely } from 'kysely'
import { DbConnectionType } from './types'
import DreamDbConnection from './dream-db-connection'

export default function db<DB extends any>(connection: DbConnectionType = 'primary'): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connection)
}
