import * as mysql from 'mysql2'
import DreamCLI from '../../../../src/cli/index.js'
import DreamApp from '../../../../src/dream-app/index.js'
import EnvInternal from '../../../../src/helpers/EnvInternal.js'
import { DbConnectionType } from '../../../../src/types/db.js'
import loadMysqlClient from './loadMysqlClient.js'

export default async function dropMysqlDb(
  connectionName: string,
  connection: DbConnectionType,
  dbName?: string | null
) {
  // this was only ever written to clear the db between tests or in development,
  // so there is no way to drop in production
  if (EnvInternal.isProduction) return false

  const dreamApp = DreamApp.getOrFail()
  const dbConf = dreamApp.dbConnectionConfig(connectionName, connection)

  dbName ||= dbConf.name || null
  if (!dbName)
    throw new Error(
      'Must either pass a dbName to the drop function, or else ensure that DB_NAME is set in the env'
    )

  const client = loadMysqlClient({ useSystemDb: true, connectionName })

  await maybeDropDuplicateDatabases(connectionName, client, dbName)
  await new Promise(accept => {
    client.query(`DROP DATABASE IF EXISTS ${dbName};`, accept)
  })
}

async function maybeDropDuplicateDatabases(connectionName: string, client: mysql.Connection, dbName: string) {
  const parallelTests = DreamApp.getOrFail().parallelTests
  if (!parallelTests) return

  if (EnvInternal.boolean('DREAM_CORE_DEVELOPMENT') && connectionName === 'default') {
    const replicaTestWorkerDatabaseName = `replica_test_${dbName}`
    DreamCLI.logger.logContinueProgress(
      `dropping fake replica test database ${replicaTestWorkerDatabaseName}`,
      { logPrefix: '  ├ [db]', logPrefixColor: 'cyan' }
    )
    await new Promise(accept => {
      client.query(`DROP DATABASE IF EXISTS ${replicaTestWorkerDatabaseName};`, () => {
        accept(undefined)
      })
    })
  }

  for (let i = 2; i <= parallelTests; i++) {
    const workerDatabaseName = `${dbName}_${i}`
    DreamCLI.logger.logContinueProgress(`dropping duplicate test database ${workerDatabaseName}`, {
      logPrefix: '  ├ [db]',
      logPrefixColor: 'cyan',
    })
    await new Promise(accept => {
      client.query(`DROP DATABASE IF EXISTS ${workerDatabaseName};`, () => {
        accept(undefined)
      })
    })
  }
}
