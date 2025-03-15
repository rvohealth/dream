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
    await writeSyncFile()
    await this.buildDreamSchema()
    await onSync()
  }

  public static async buildDreamSchema() {
    const spinner = DreamCLI.logger.log('writing dream schema...', { spinner: true })
    await new SchemaBuilder().build()
    spinner.stop()
  }

  public static async dbCreate() {
    const connectionRetriever = new ConnectionConfRetriever()
    const primaryDbConf = connectionRetriever.getConnectionConf('primary')

    const spinner = DreamCLI.logger.log(`creating ${primaryDbConf.name}...`, { spinner: true })
    await createDb('primary')

    // TODO: add support for creating replicas. Began doing it below, but it is very tricky,
    // and we don't need it at the moment, so kicking off for future development when we have more time
    // to flesh this out.
    // if (connectionRetriever.hasReplicaConfig()) {
    //   const replicaDbConf = connectionRetriever.getConnectionConf('replica')
    //   console.log(`creating ${process.env[replicaDbConf.name]}`)
    //   await createDb('replica')
    // }

    spinner.stop()
  }

  public static async dbDrop() {
    const connectionRetriever = new ConnectionConfRetriever()
    const primaryDbConf = connectionRetriever.getConnectionConf('primary')

    const spinner = DreamCLI.logger.log(`dropping ${primaryDbConf.name}...`, { spinner: true })
    await _dropDb('primary')

    // TODO: add support for dropping replicas. Began doing it below, but it is very tricky,
    // and we don't need it at the moment, so kicking off for future development when we have more time
    // to flesh this out.
    // if (connectionRetriever.hasReplicaConfig()) {
    //   const replicaDbConf = connectionRetriever.getConnectionConf('replica')
    //   console.log(`dropping ${process.env[replicaDbConf.name]}`)
    //   await _dropDb('replica')
    // }

    spinner.stop()
  }

  public static async dbMigrate() {
    const connectionRetriever = new ConnectionConfRetriever()
    const primaryDbConf = connectionRetriever.getConnectionConf('primary')
    const spinner = DreamCLI.logger.log(`migrating ${primaryDbConf.name}...`, { spinner: true })

    await runMigration({ mode: 'migrate' })
    await this.duplicateDatabase()

    spinner.stop()
  }

  public static async dbRollback(opts: { steps: number }) {
    const connectionRetriever = new ConnectionConfRetriever()
    const primaryDbConf = connectionRetriever.getConnectionConf('primary')
    const spinner = DreamCLI.logger.log(`rolling back ${primaryDbConf.name}...`, { spinner: true })

    let step = opts.steps
    while (step > 0) {
      await runMigration({ mode: 'rollback' })
      step -= 1
    }
    await this.duplicateDatabase()

    spinner.stop()
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
    DreamCLI.logger.log('generating docs...')
    await sspawn('yarn typedoc src/index.ts --tsconfig ./tsconfig.esm.build.json --out docs')
  }

  private static async duplicateDatabase() {
    const parallelTests = DreamApplication.getOrFail().parallelTests
    if (!parallelTests) return

    const connectionRetriever = new ConnectionConfRetriever()
    const dbConf = connectionRetriever.getConnectionConf('primary')
    const client = await loadPgClient({ useSystemDb: true })

    if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
      const replicaTestWorkerDatabaseName = `replica_test_${dbConf.name}`
      const spinner = DreamCLI.logger.log(
        `creating fake replica test database ${replicaTestWorkerDatabaseName}...`,
        {
          spinner: true,
        }
      )
      await client.query(`DROP DATABASE IF EXISTS ${replicaTestWorkerDatabaseName};`)
      await client.query(`CREATE DATABASE ${replicaTestWorkerDatabaseName} TEMPLATE ${dbConf.name};`)
      spinner.stop()
    }

    for (let i = 2; i <= parallelTests; i++) {
      const workerDatabaseName = `${dbConf.name}_${i}`

      console.log(`creating duplicate test database ${workerDatabaseName} for concurrent tests`)
      const spinner = DreamCLI.logger.log(
        `creating duplicate test database ${workerDatabaseName} for concurrent tests...`,
        {
          spinner: true,
        }
      )
      await client.query(`DROP DATABASE IF EXISTS ${workerDatabaseName};`)
      await client.query(`CREATE DATABASE ${workerDatabaseName} TEMPLATE ${dbConf.name};`)
      spinner.stop()
    }
    await client.end()
  }
}
