import '../helpers/loadEnv'

import ConnectionConfRetriever from '../db/connection-conf-retriever'
import { getCachedDreamApplicationOrFail } from '../dream-application/cache'
import SchemaBuilder from '../helpers/cli/SchemaBuilder'
import generateDream from '../helpers/cli/generateDream'
import generateFactory from '../helpers/cli/generateFactory'
import generateMigration from '../helpers/cli/generateMigration'
import generateSerializer from '../helpers/cli/generateSerializer'
import createDb from '../helpers/db/createDb'
import _dropDb from '../helpers/db/dropDb'
import runMigration from '../helpers/db/runMigration'
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
    const connectionRetriever = new ConnectionConfRetriever(getCachedDreamApplicationOrFail())
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
    const connectionRetriever = new ConnectionConfRetriever(getCachedDreamApplicationOrFail())
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

    // release the db connection
    // await db('primary', getCachedDreamApplicationOrFail()).destroy()
  }

  public static async dbRollback() {
    let step = process.argv[2] ? parseInt(process.argv[2]) : 1
    while (step > 0) {
      await runMigration({ mode: 'rollback', step })
      step -= 1
    }

    // await db('primary', getCachedDreamApplicationOrFail()).destroy()
  }

  public static async generateDream() {
    const argv = process.argv.filter(arg => !/^--/.test(arg))
    const name = argv[2]
    const args = argv.slice(3, argv.length)
    await generateDream(name, args)
  }

  public static async generateFactory() {
    const argv = process.argv.filter(arg => !/^--/.test(arg))
    const name = argv[2]
    const args = argv.slice(3, argv.length)
    await generateFactory(name, args)
  }

  public static async generateMigration() {
    const argv = process.argv.filter(arg => !/^--/.test(arg))
    const name = argv[2]
    await generateMigration(name)
  }

  public static async generateSerializer() {
    const argv = process.argv.filter(arg => !/^--/.test(arg))
    const name = argv[2]
    const args = argv.slice(3, argv.length)
    await generateSerializer(name, args)
  }
}
