import ConnectionConfRetriever from '../db/ConnectionConfRetriever'
import DreamApplication from '../dream-application'
import SchemaBuilder from '../helpers/cli/SchemaBuilder'
import generateDream from '../helpers/cli/generateDream'
import generateMigration from '../helpers/cli/generateMigration'
import createDb from '../helpers/db/createDb'
import _dropDb from '../helpers/db/dropDb'
import loadPgClient from '../helpers/db/loadPgClient'
import runMigration from '../helpers/db/runMigration'
import '../helpers/loadEnv'
import sspawn from '../helpers/sspawn'
import writeSyncFile from './helpers/sync'

export default class DreamBin {
  public static async sync(onSync: () => Promise<void> | void) {
    await writeSyncFile()
    await this.buildDreamSchema()
    await onSync()
  }

  public static async buildDreamSchema() {
    console.log('writing dream schema...')
    await new SchemaBuilder().build()
    console.log('Done!')
  }

  public static async dbCreate() {
    const connectionRetriever = new ConnectionConfRetriever()
    const primaryDbConf = connectionRetriever.getConnectionConf('primary')

    console.log(`creating ${primaryDbConf.name}`)
    await createDb('primary')

    // TODO: add support for creating replicas. Began doing it below, but it is very tricky,
    // and we don't need it at the moment, so kicking off for future development when we have more time
    // to flesh this out.
    // if (connectionRetriever.hasReplicaConfig()) {
    //   const replicaDbConf = connectionRetriever.getConnectionConf('replica')
    //   console.log(`creating ${process.env[replicaDbConf.name]}`)
    //   await createDb('replica')
    // }

    console.log('complete!')
  }

  public static async dbDrop() {
    const connectionRetriever = new ConnectionConfRetriever()
    const primaryDbConf = connectionRetriever.getConnectionConf('primary')

    console.log(`dropping ${primaryDbConf.name}`)
    await _dropDb('primary')

    // TODO: add support for dropping replicas. Began doing it below, but it is very tricky,
    // and we don't need it at the moment, so kicking off for future development when we have more time
    // to flesh this out.
    // if (connectionRetriever.hasReplicaConfig()) {
    //   const replicaDbConf = connectionRetriever.getConnectionConf('replica')
    //   console.log(`dropping ${process.env[replicaDbConf.name]}`)
    //   await _dropDb('replica')
    // }

    console.log('complete!')
  }

  public static async dbMigrate() {
    await runMigration({ mode: 'migrate' })
    await this.duplicateDatabase()
  }

  public static async dbRollback(opts: { steps: number }) {
    let step = opts.steps
    while (step > 0) {
      await runMigration({ mode: 'rollback' })
      step -= 1
    }
    await this.duplicateDatabase()
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
    console.log('generating docs...')
    await sspawn('yarn typedoc src/index.ts --tsconfig ./tsconfig.esm.build.json --out docs')
    console.log('done!')
  }

  private static async duplicateDatabase() {
    const parallelTests = DreamApplication.getOrFail().parallelTests
    if (!parallelTests) return

    const connectionRetriever = new ConnectionConfRetriever()
    const dbConf = connectionRetriever.getConnectionConf('primary')
    const client = await loadPgClient({ useSystemDb: true })

    if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
      const replicaTestWorkerDatabaseName = `replica_test_${dbConf.name}`
      console.log(`creating fake replica test database ${replicaTestWorkerDatabaseName}`)
      await client.query(`DROP DATABASE IF EXISTS ${replicaTestWorkerDatabaseName};`)
      await client.query(`CREATE DATABASE ${replicaTestWorkerDatabaseName} TEMPLATE ${dbConf.name};`)
    }

    for (let i = 2; i <= parallelTests; i++) {
      const workerDatabaseName = `${dbConf.name}_${i}`

      console.log(`creating duplicate test database ${workerDatabaseName} for concurrent tests`)
      await client.query(`DROP DATABASE IF EXISTS ${workerDatabaseName};`)
      await client.query(`CREATE DATABASE ${workerDatabaseName} TEMPLATE ${dbConf.name};`)
    }
    await client.end()
  }
}
