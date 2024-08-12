import ConnectionConfRetriever from '../db/connection-conf-retriever'
import DreamApplication from '../dream-application'
import { getCachedDreamApplicationOrFail } from '../dream-application/cache'
import _dropDb from '../helpers/db/dropDb'
import initializeDream from '../helpers/initializeDream'
import '../helpers/loadEnv'

async function dbDrop() {
  await DreamApplication.configure()
  await initializeDream()

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
  process.exit()
}

void dbDrop()
