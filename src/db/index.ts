import { Kysely } from 'kysely'
import { Settings } from 'luxon'
import Dream from '../Dream'
import EnvInternal from '../helpers/EnvInternal'
import '../helpers/loadEnv'
import DreamDbConnection from './DreamDbConnection'
import { DbConnectionType } from './types'

if (EnvInternal.string('TZ', { optional: true })) Settings.defaultZone = EnvInternal.string('TZ')

export default function db<T extends Dream, DB extends T['DB'] = T['DB']>(
  connectionType: DbConnectionType = 'primary'
): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connectionType)
}
