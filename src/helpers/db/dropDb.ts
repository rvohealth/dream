import { Client } from 'pg'
import DreamApplication from '../../dream-application/index.js'
import { DbConnectionType } from '../../types/db.js'
import EnvInternal from '../EnvInternal.js'
import loadPgClient from './loadPgClient.js'
import DreamCLI from '../../cli/index.js'

export default async function dropDb(connection: DbConnectionType, dbName?: string | null) {
  // this was only ever written to clear the db between tests or in development,
  // so there is no way to drop in production
  if (EnvInternal.isProduction) return false

  const dreamApp = DreamApplication.getOrFail()
  const dbConf = dreamApp.dbConnectionConfig(connection)

  dbName ||= dbConf.name || null
  if (!dbName)
    throw new Error(
      'Must either pass a dbName to the drop function, or else ensure that DB_NAME is set in the env'
    )

  const client = await loadPgClient({ useSystemDb: true })

  await maybeDropDuplicateDatabases(client, dbName)
  await client.query(`DROP DATABASE IF EXISTS ${dbName};`)
}

async function maybeDropDuplicateDatabases(client: Client, dbName: string) {
  const parallelTests = DreamApplication.getOrFail().parallelTests
  if (!parallelTests) return

  if (EnvInternal.boolean('DREAM_CORE_DEVELOPMENT')) {
    const replicaTestWorkerDatabaseName = `replica_test_${dbName}`
    DreamCLI.logger.logContinueProgress(
      `dropping fake replica test database ${replicaTestWorkerDatabaseName}`,
      { logPrefix: '  ├ [db]', logPrefixColor: 'cyan' }
    )
    await client.query(`DROP DATABASE IF EXISTS ${replicaTestWorkerDatabaseName};`)
  }

  for (let i = 2; i <= parallelTests; i++) {
    const workerDatabaseName = `${dbName}_${i}`
    DreamCLI.logger.logContinueProgress(`dropping duplicate test database ${workerDatabaseName}`, {
      logPrefix: '  ├ [db]',
      logPrefixColor: 'cyan',
    })
    await client.query(`DROP DATABASE IF EXISTS ${workerDatabaseName};`)
  }
}
