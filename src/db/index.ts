import '../helpers/loadEnv'
import { Kysely } from 'kysely'
import { DbConnectionType } from './types'
import DreamDbConnection from './dream-db-connection'
import Dreamconf from '../../shared/dreamconf'

export default function db<DB extends any>(
  connection: DbConnectionType = 'primary',
  dreamconf: Dreamconf
): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connection, dreamconf)
}
