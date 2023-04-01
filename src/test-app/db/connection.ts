import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { Database } from '../conf/schema'
import userDreamConf from '../conf/dream'
import loadEnv from '../../helpers/loadEnv'

loadEnv()

export default new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      user: userDreamConf.db.user || '',
      password: userDreamConf.db.password || '',
      database: userDreamConf.db.name,
      host: userDreamConf.db.host || 'localhost',
      port: userDreamConf.db.port ? parseInt(userDreamConf.db.port) : 5432,
    }),
  }),
})
