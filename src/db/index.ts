import '../helpers/loadEnv'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { Database } from '../sync/schema'
import userDreamConf from '../sync/dream'

const c: any = userDreamConf
export default new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      user: c.db.user || '',
      password: c.db.password || '',
      database: c.db.name,
      host: c.db.host || 'localhost',
      port: c.db.port ? parseInt(c.db.port) : 5432,
    }),
  }),
})
