import { Kysely } from 'kysely'
import { Settings } from 'luxon'
import Dream from '../dream'
import '../helpers/loadEnv'
import DreamDbConnection from './dream-db-connection'
import { DbConnectionType } from './types'
import { envValue } from '../helpers/envHelpers'

if (envValue('TZ')) Settings.defaultZone = envValue('TZ')

export default function db<T extends Dream, DB extends T['DB'] = T['DB']>(
  connectionType: DbConnectionType = 'primary'
): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connectionType)
}
