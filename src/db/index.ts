import { Kysely } from 'kysely'
import { Settings } from 'luxon'
import Dream from '../Dream2'
import { envValue } from '../helpers/envHelpers'
import '../helpers/loadEnv'
import DreamDbConnection from './DreamDbConnection'
import { DbConnectionType } from './types'

if (envValue('TZ')) Settings.defaultZone = envValue('TZ')

export default function db<T extends Dream, DB extends T['DB'] = T['DB']>(
  connectionType: DbConnectionType = 'primary'
): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connectionType)
}
