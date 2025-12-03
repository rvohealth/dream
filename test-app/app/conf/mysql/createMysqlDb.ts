import DreamApp from '../../../../src/dream-app/index.js'
import { DbConnectionType } from '../../../../src/types/db.js'
import EnvInternal from '../../../../src/helpers/EnvInternal.js'
import loadMysqlClient from './loadMysqlClient.js'

export default async function createMysqlDb(
  connectionName: string,
  connectionType: DbConnectionType,
  dbName?: string | null
) {
  // this was only ever written to clear the db between tests or in development,
  // so there is no way to drop in production
  if (EnvInternal.isProduction) return false

  const dreamApp = DreamApp.getOrFail()
  const dbConf = dreamApp.dbConnectionConfig(connectionName, connectionType)

  dbName ||= dbConf.name || null
  if (!dbName)
    throw new Error(
      'Must either pass a dbName to the create function, or else ensure that DB_NAME is set in the env'
    )

  const client = loadMysqlClient({ useSystemDb: true, connectionName })

  await new Promise(accept => {
    client.query(`CREATE DATABASE ${dbName};`, err => {
      if (err) {
        // eslint-disable-next-line no-console
        console.log(`FAILED TO CREATE MYSQL DB: ${dbName}. Error:`)
        // eslint-disable-next-line no-console
        console.error(err)
      }
      client.end(accept)
    })
  })
}
