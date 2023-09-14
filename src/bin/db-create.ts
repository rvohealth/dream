import '../helpers/loadEnv'
import createDb from '../helpers/db/createDb'
import ConnectionConfRetriever from '../db/connection-conf-retriever'
import loadDreamconfFile from '../../shared/helpers/path/loadDreamconfFile'

async function dbCreate() {
  const dreamconf = await loadDreamconfFile()
  const connectionRetriever = new ConnectionConfRetriever(dreamconf)
  const primaryDbConf = connectionRetriever.getConnectionConf('primary')

  console.log(`creating ${process.env[primaryDbConf.name]}`)
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
  process.exit()
}

dbCreate()
