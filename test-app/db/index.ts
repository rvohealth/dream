import PostgresQueryDriver from '../../src/dream/QueryDriver/Postgres.js'
import { DbConnectionType } from '../../src/types/db.js'

export default function db(connectionName: string, connectionType: DbConnectionType = 'primary') {
  return PostgresQueryDriver.dbFor(connectionName, connectionType)
}
