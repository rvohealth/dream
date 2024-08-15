import { Kysely } from 'kysely'
import { Settings } from 'luxon'
import Dream from '../dream'
import DreamApplication from '../dream-application'
import '../helpers/loadEnv'
import DreamDbConnection from './dream-db-connection'
import { DbConnectionType } from './types'

if (process.env.TZ) Settings.defaultZone = process.env.TZ

export default function db<T extends Dream, DB extends T['DB'] = T['DB']>(
  connection: DbConnectionType = 'primary',
  dreamconf: DreamApplication
): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connection, dreamconf)
}
