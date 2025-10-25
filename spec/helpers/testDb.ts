import PostgresQueryDriver from '../../src/dream/QueryDriver/Postgres.js'
import { DbConnectionType } from '../../src/types/db.js'

export default function testDb(connectionName: string, connectionType: DbConnectionType) {
  return PostgresQueryDriver.dbFor(connectionName, connectionType)
}
