import '../helpers/loadEnv'

import ConnectionConfRetriever from '../db/connection-conf-retriever'
import SchemaBuilder from '../helpers/cli/SchemaBuilder'
import generateDream from '../helpers/cli/generateDream'
import generateFactory from '../helpers/cli/generateFactory'
import generateMigration from '../helpers/cli/generateMigration'
import generateSerializer from '../helpers/cli/generateSerializer'
import createDb from '../helpers/db/createDb'
import _dropDb from '../helpers/db/dropDb'
import runMigration from '../helpers/db/runMigration'
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

    // release the db connection
    // await db('primary', DreamApplication.getOrFail()).destroy()
  }

  public static async dbRollback() {
    let step = process.argv[3] ? parseInt(process.argv[3]) : 1
    while (step > 0) {
      await runMigration({ mode: 'rollback', step })
      step -= 1
    }

    // await db('primary', DreamApplication.getOrFail()).destroy()
  }

  public static async generateDream() {
    const argv = process.argv.filter(arg => !/^--/.test(arg))
    const name = argv[3]
    const args = argv.slice(4, argv.length)
    await generateDream(name, args)
  }

  public static async generateStiChild() {
    const argv = process.argv.filter(arg => !/^--/.test(arg))
    const name = argv[3]
    const extendsWord = argv[4]
    if (extendsWord !== 'extends') throw new Error('Expecting: `<child-name> extends <parent-name> <args>')
    const parentName = argv[5]
    const args = argv.slice(6, argv.length)
    await generateDream(name, args, parentName)
  }

  public static async generateFactory() {
    const argv = process.argv.filter(arg => !/^--/.test(arg))
    const name = argv[3]
    const args = argv.slice(4, argv.length)
    await generateFactory(name, args)
  }

  public static async generateMigration() {
    const argv = process.argv.filter(arg => !/^--/.test(arg))
    const name = argv[3]
    await generateMigration(name, [])
  }

  public static async generateSerializer() {
    const argv = process.argv.filter(arg => !/^--/.test(arg))
    const name = argv[3]
    const args = argv.slice(4, argv.length)
    await generateSerializer(name, args)
  }

  // though this is a private method, it is still used internally.
  // It is only made private so that people don't mistakenly try
  // to use it to generate docs for their apps.
  private static async buildDocs() {
    console.log('generating docs...')
    await sspawn('yarn typedoc src/index.ts --tsconfig ./tsconfig.build.json --out docs')
    console.log('done!')
  }
}
