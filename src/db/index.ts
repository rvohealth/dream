import '../helpers/loadEnv'
import { Kysely } from 'kysely'
import Dream from '../dream'
import { DbConnectionType } from './types'
import DreamDbConnection from './dream-db-connection'
import Dreamconf from '../../shared/dreamconf'
import { Settings } from 'luxon'

if (process.env.TZ) Settings.defaultZone = process.env.TZ

export default function db<T extends Dream, DB extends T['DB'] = T['DB']>(
  connection: DbConnectionType = 'primary',
  dreamconf: Dreamconf
): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connection, dreamconf)
}
