import { Client } from 'pg'
import ConnectionConfRetriever from '../../db/ConnectionConfRetriever.js'
import { DbConnectionType } from '../../db/types.js'
import DreamApplication from '../../dream-application/index.js'
import EnvInternal from '../EnvInternal.js'
import loadPgClient from './loadPgClient.js'

export default async function dropDb(connection: DbConnectionType, dbName?: string | null) {
  // this was only ever written to clear the db between tests or in development,
  // so there is no way to drop in production
  if (EnvInternal.isProduction) return false

  const connectionRetriever = new ConnectionConfRetriever()
  const dbConf = connectionRetriever.getConnectionConf(connection)

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

  if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
    const replicaTestWorkerDatabaseName = `replica_test_${dbName}`
    console.log(`dropping fake replica test database ${replicaTestWorkerDatabaseName}`)
    await client.query(`DROP DATABASE IF EXISTS ${replicaTestWorkerDatabaseName};`)
  }

  for (let i = 2; i <= parallelTests; i++) {
    const workerDatabaseName = `${dbName}_${i}`
    console.log(`dropping duplicate test database ${workerDatabaseName}`)
    await client.query(`DROP DATABASE IF EXISTS ${workerDatabaseName};`)
  }
}
