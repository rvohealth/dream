import ConnectionConfRetriever from '../db/connection-conf-retriever'
import DreamApplication from '../dream-application'
import { getCachedDreamApplicationOrFail } from '../dream-application/cache'
import createDb from '../helpers/db/createDb'
import initializeDream from '../helpers/initializeDream'
import '../helpers/loadEnv'

async function dbCreate() {
  await DreamApplication.configure()
  await initializeDream()

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
  process.exit()
}

void dbCreate()
