import { Kysely } from 'kysely'
import { Settings } from 'luxon'
import Dream from '../dream'
import Dreamconf from '../helpers/dreamconf'
import '../helpers/loadEnv'
import DreamDbConnection from './dream-db-connection'
import { DbConnectionType } from './types'

if (process.env.TZ) Settings.defaultZone = process.env.TZ

export default function db<T extends Dream, DB extends T['dreamconf']['DB'] = T['dreamconf']['DB']>(
  connection: DbConnectionType = 'primary',
  dreamconf: Dreamconf
): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connection, dreamconf)
}
