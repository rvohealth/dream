import ConnectionConfRetriever from '../db/connection-conf-retriever'
import createDb from '../helpers/db/createDb'
import initializeDream from '../helpers/initializeDream'
import '../helpers/loadEnv'
import loadEnvConf from '../helpers/path/loadEnvConf'

async function dbCreate() {
  await initializeDream()

  const connectionRetriever = new ConnectionConfRetriever(await loadEnvConf())
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

void dbCreate()
