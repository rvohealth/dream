import '../helpers/loadEnv'
import { Kysely } from 'kysely'
import { DB } from '../sync/schema'
import { DbConnectionType } from './types'
import DreamDbConnection from './dream-db-connection'

export default (connection: DbConnectionType = 'primary'): Kysely<DB> =>
  DreamDbConnection.getConnection(connection)
