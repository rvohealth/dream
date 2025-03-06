import { Kysely } from 'kysely'
import { Settings } from 'luxon'
import Dream from '../Dream.js'
import EnvInternal from '../helpers/EnvInternal.js'
import '../helpers/loadEnv.js'
import DreamDbConnection from './DreamDbConnection.js'
import { DbConnectionType } from './types.js'

if (EnvInternal.string('TZ', { optional: true })) Settings.defaultZone = EnvInternal.string('TZ')

export default function db<T extends Dream, DB extends T['DB'] = T['DB']>(
  connectionType: DbConnectionType = 'primary'
): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connectionType)
}
