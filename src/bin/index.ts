import ConnectionConfRetriever from '../db/connection-conf-retriever'
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
  public static async sync() {
    await writeSyncFile()
    await this.buildDreamSchema()
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

    // release the db connection
    // await db('primary', DreamApplication.getOrFail()).destroy()
  }

  public static async dbRollback(opts: { steps: number }) {
    let step = opts.steps
    while (step > 0) {
      await runMigration({ mode: 'rollback' })
      step -= 1
    }
    await this.duplicateDatabase()

    // await db('primary', DreamApplication.getOrFail()).destroy()
  }

  public static async generateDream(modelName: string, args: string[], options: { serializer: boolean }) {
    await generateDream(modelName, args, options)
  }

  public static async generateStiChild(
    childModelName: string,
    parentModelName: string,
    args: string[],
    options: { serializer: boolean }
  ) {
    await generateDream(childModelName, args, options, parentModelName)
  }

  public static async generateMigration(migrationName: string, args: string[]) {
    await generateMigration(migrationName, args)
  }

  // though this is a private method, it is still used internally.
  // It is only made private so that people don't mistakenly try
  // to use it to generate docs for their apps.
  private static async buildDocs() {
    console.log('generating docs...')
    await sspawn('yarn typedoc src/index.ts --tsconfig ./tsconfig.build.json --out docs')
    console.log('done!')
  }

  private static async duplicateDatabase() {
    const parallelTests = DreamApplication.getOrFail().parallelTests
    if (!parallelTests) return

    const connectionRetriever = new ConnectionConfRetriever()
    const dbConf = connectionRetriever.getConnectionConf('primary')
    const client = await loadPgClient({ useSystemDb: true })

    for (let i = 2; i <= parallelTests; i++) {
      const workerDatabaseName = `${dbConf.name}_${i}`

      console.log(`creating duplicate test database ${workerDatabaseName} for concurrent tests`)
      await client.query(`DROP DATABASE IF EXISTS ${workerDatabaseName};`)
      await client.query(`CREATE DATABASE ${workerDatabaseName} TEMPLATE ${dbConf.name};`)
    }
    await client.end()
  }
}
