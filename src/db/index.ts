import { Kysely } from 'kysely'
import { Settings } from 'luxon'
import Dream from '../dream'
import '../helpers/loadEnv'
import { EnvOpts } from '../helpers/path/types'
import DreamDbConnection from './dream-db-connection'
import { DbConnectionType } from './types'

if (process.env.TZ) Settings.defaultZone = process.env.TZ

export default function db<T extends Dream, DB extends T['DB'] = T['DB']>(
  connection: DbConnectionType = 'primary',
  env: EnvOpts
): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connection, env)
}
