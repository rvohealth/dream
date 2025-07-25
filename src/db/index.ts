import { Kysely } from 'kysely'
import { SingleDbCredential } from '../dream-app/index.js'
import Dream from '../Dream.js'
import { Settings } from '../helpers/DateTime.js'
import EnvInternal from '../helpers/EnvInternal.js'
import { DbConnectionType } from '../types/db.js'
import DreamDbConnection from './DreamDbConnection.js'

if (EnvInternal.string('TZ', { optional: true })) Settings.defaultZone = EnvInternal.string('TZ')

export default function db<T extends Dream, DB extends T['DB'] = T['DB']>(
  connectionName: string,
  connectionType: DbConnectionType,
  dialectProvider: (connectionConf: SingleDbCredential) => any
): Kysely<DB> {
  return DreamDbConnection.getConnection<DB>(connectionName, connectionType, dialectProvider)
}
