import DreamCLI from '../cli/index.js'
import ConnectionConfRetriever from '../db/ConnectionConfRetriever.js'
import DreamApplication from '../dream-application/index.js'
import SchemaBuilder from '../helpers/cli/SchemaBuilder.js'
import generateDream from '../helpers/cli/generateDream.js'
import generateMigration from '../helpers/cli/generateMigration.js'
import createDb from '../helpers/db/createDb.js'
import _dropDb from '../helpers/db/dropDb.js'
import loadPgClient from '../helpers/db/loadPgClient.js'
import runMigration from '../helpers/db/runMigration.js'
import '../helpers/loadEnv.js'
import sspawn from '../helpers/sspawn.js'
import writeSyncFile from './helpers/sync.js'

export default class DreamBin {
  public static async sync(onSync: () => Promise<void> | void) {
    DreamCLI.logger.logStartProgress('writing db schema...')
    await writeSyncFile()
    DreamCLI.logger.logEndProgress()

    DreamCLI.logger.logStartProgress('building dream schema...')
    await this.buildDreamSchema()
    DreamCLI.logger.logEndProgress()

    // intentionally leaving logs off here, since it allows other
    // onSync handlers to determine their own independent logging approach
    await onSync()
  }

  public static async buildDreamSchema() {
    await new SchemaBuilder().build()
  }

  public static async dbCreate() {
    const connectionRetriever = new ConnectionConfRetriever()
    const primaryDbConf = connectionRetriever.getConnectionConf('primary')

    DreamCLI.logger.logStartProgress(`creating ${primaryDbConf.name}...`)
    await createDb('primary')
    DreamCLI.logger.logEndProgress()

    // TODO: add support for creating replicas. Began doing it below, but it is very tricky,
    // and we don't need it at the moment, so kicking off for future development when we have more time
    // to flesh this out.
    // if (connectionRetriever.hasReplicaConfig()) {
    //   const replicaDbConf = connectionRetriever.getConnectionConf('replica')
    //   console.log(`creating ${process.env[replicaDbConf.name]}`)
    //   await createDb('replica')
    // }
  }

  public static async dbDrop() {
    const connectionRetriever = new ConnectionConfRetriever()
    const primaryDbConf = connectionRetriever.getConnectionConf('primary')

    DreamCLI.logger.logStartProgress(`dropping ${primaryDbConf.name}...`)
    await _dropDb('primary')
    DreamCLI.logger.logEndProgress()

    // TODO: add support for dropping replicas. Began doing it below, but it is very tricky,
    // and we don't need it at the moment, so kicking off for future development when we have more time
    // to flesh this out.
    // if (connectionRetriever.hasReplicaConfig()) {
    //   const replicaDbConf = connectionRetriever.getConnectionConf('replica')
    //   console.log(`dropping ${process.env[replicaDbConf.name]}`)
    //   await _dropDb('replica')
    // }
  }

  public static async dbMigrate() {
    const connectionRetriever = new ConnectionConfRetriever()
    const primaryDbConf = connectionRetriever.getConnectionConf('primary')
    DreamCLI.logger.logStartProgress(`migrating ${primaryDbConf.name}...`)

    await runMigration({ mode: 'migrate' })
    await this.duplicateDatabase()
    DreamCLI.logger.logEndProgress()
  }

  public static async dbRollback(opts: { steps: number }) {
    const connectionRetriever = new ConnectionConfRetriever()
    const primaryDbConf = connectionRetriever.getConnectionConf('primary')
    DreamCLI.logger.logStartProgress(`rolling back ${primaryDbConf.name}...`)

    let step = opts.steps
    while (step > 0) {
      await runMigration({ mode: 'rollback' })
      step -= 1
    }
    await this.duplicateDatabase()

    DreamCLI.logger.logEndProgress()
  }

  public static async generateDream(
    fullyQualifiedModelName: string,
    columnsWithTypes: string[],
    options: { serializer: boolean }
  ) {
    await generateDream({ fullyQualifiedModelName, columnsWithTypes, options })
  }

  public static async generateStiChild(
    fullyQualifiedModelName: string,
    fullyQualifiedParentName: string,
    columnsWithTypes: string[],
    options: { serializer: boolean }
  ) {
    await generateDream({ fullyQualifiedModelName, columnsWithTypes, options, fullyQualifiedParentName })
  }

  public static async generateMigration(migrationName: string, columnsWithTypes: string[]) {
    await generateMigration({ migrationName, columnsWithTypes })
  }

  // though this is a private method, it is still used internally.
  // It is only made private so that people don't mistakenly try
  // to use it to generate docs for their apps.
  private static async buildDocs() {
    DreamCLI.logger.logStartProgress('generating docs...')
    await sspawn('yarn typedoc src/index.ts --tsconfig ./tsconfig.esm.build.json --out docs')
    DreamCLI.logger.logEndProgress()
  }

  private static async duplicateDatabase() {
    const parallelTests = DreamApplication.getOrFail().parallelTests
    if (!parallelTests) return

    const connectionRetriever = new ConnectionConfRetriever()
    const dbConf = connectionRetriever.getConnectionConf('primary')
    const client = await loadPgClient({ useSystemDb: true })

    if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
      const replicaTestWorkerDatabaseName = `replica_test_${dbConf.name}`
      DreamCLI.logger.logContinueProgress(
        `creating fake replica test database ${replicaTestWorkerDatabaseName}...`
      )
      await client.query(`DROP DATABASE IF EXISTS ${replicaTestWorkerDatabaseName};`)
      await client.query(`CREATE DATABASE ${replicaTestWorkerDatabaseName} TEMPLATE ${dbConf.name};`)
    }

    for (let i = 2; i <= parallelTests; i++) {
      const workerDatabaseName = `${dbConf.name}_${i}`

      console.log(`creating duplicate test database ${workerDatabaseName} for concurrent tests`)
      DreamCLI.logger.logContinueProgress(
        `creating duplicate test database ${workerDatabaseName} for concurrent tests...`
      )
      await client.query(`DROP DATABASE IF EXISTS ${workerDatabaseName};`)
      await client.query(`CREATE DATABASE ${workerDatabaseName} TEMPLATE ${dbConf.name};`)
    }
    await client.end()
  }
}
