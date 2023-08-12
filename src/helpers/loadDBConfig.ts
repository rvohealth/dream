import ConnectionRetriever from '../db/connection-retriever'
import { DbConnectionType } from '../db/types'

export default async function loadDBConfig(connection: DbConnectionType = 'primary') {
  const connectionConf = new ConnectionRetriever().getConnection(connection)

  return {
    host: process.env[connectionConf.host] || 'localhost',
    user: process.env[connectionConf.user] || 'postgres',
    password: process.env[connectionConf.password] || '',
    port: process.env[connectionConf.port] ? parseInt(process.env[connectionConf.port] as string) : 5432,
    name: process.env[connectionConf.name] || 'dream_app_dev',
    use_ssl: connectionConf.use_ssl ? process.env[connectionConf.use_ssl] : false,
  }
}
