import '../helpers/loadEnv'
import _dropDb from '../helpers/db/dropDb'
import ConnectionConfRetriever from '../db/connection-conf-retriever'

async function dbDrop() {
  const connectionRetriever = new ConnectionConfRetriever()
  const primaryDbConf = connectionRetriever.getConnectionConf('primary')
  console.log('HELLOBIRLD', primaryDbConf, process.env)

  console.log(`dropping ${process.env[primaryDbConf.name]}`)
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

dbDrop()
