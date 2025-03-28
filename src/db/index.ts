import { Kysely } from 'kysely'
import Dream from '../Dream.js'
import { Settings } from '../helpers/DateTime.js'
import EnvInternal from '../helpers/EnvInternal.js'
import { DbConnectionType } from '../types/db.js'
import DreamDbConnection from './DreamDbConnection.js'

if (EnvInternal.string('TZ', { optional: true })) Settings.defaultZone = EnvInternal.string('TZ')

export default function db<T extends Dream, DB extends T['DB'] = T['DB']>(
  connectionType: DbConnectionType = 'primary'
): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connectionType)
}
