import '../helpers/loadEnv'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { DB } from '../sync/schema'
import configCache from '../sync/config-cache'

export default new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      user: process.env[configCache.db.user] || '',
      password: process.env[configCache.db.password] || '',
      database: process.env[configCache.db.name],
      host: process.env[configCache.db.host] || 'localhost',
      port: process.env[configCache.db.port] ? parseInt(process.env[configCache.db.port]!) : 5432,
      ssl: process.env[configCache.db.use_ssl] === '1',
    }),
  }),
})
