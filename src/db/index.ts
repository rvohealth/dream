import '../helpers/loadEnv'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { DB } from '../sync/schema'

console.log('ABOUT TO INITIALIZE DB:', process.env.DB_SSL)
export default new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      ssl: process.env.DB_SSL === '1',
    }),
  }),
})
