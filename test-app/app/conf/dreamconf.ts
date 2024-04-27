import Dreamconf from '../../../src/helpers/dreamconf'
import { DBClass } from '../../db/types'
import { schema } from '../../db/schema'

const env = {
  db: {
    development: {
      primary: {
        user: 'DB_USER',
        password: 'DB_PASSWORD',
        host: 'PRIMARY_DB_HOST',
        name: 'PRIMARY_DB_NAME',
        port: 'DB_PORT',
        use_ssl: 'DB_USE_SSL',
      },
      replica: {
        user: 'DB_USER',
        password: 'DB_PASSWORD',
        host: 'REPLICA_DB_HOST',
        name: 'REPLICA_DB_NAME',
        port: 'DB_PORT',
        use_ssl: 'DB_USE_SSL',
      },
    },
    test: {
      primary: {
        user: 'DB_USER',
        password: 'DB_PASSWORD',
        host: 'PRIMARY_DB_HOST',
        name: 'PRIMARY_DB_NAME',
        port: 'DB_PORT',
        use_ssl: 'DB_USE_SSL',
      },
      replica: {
        user: 'DB_USER',
        password: 'DB_PASSWORD',
        host: 'REPLICA_DB_HOST',
        name: 'REPLICA_DB_NAME',
        port: 'DB_PORT',
        use_ssl: 'DB_USE_SSL',
      },
    },
    production: {
      primary: {
        user: 'DB_USER',
        password: 'DB_PASSWORD',
        host: 'PRIMARY_DB_HOST',
        name: 'PRIMARY_DB_NAME',
        port: 'DB_PORT',
        use_ssl: 'DB_USE_SSL',
      },
      replica: {
        user: 'DB_USER',
        password: 'DB_PASSWORD',
        host: 'REPLICA_DB_HOST',
        name: 'REPLICA_DB_NAME',
        port: 'DB_PORT',
        use_ssl: 'DB_USE_SSL',
      },
    },
  },
}

const dreamconf = new Dreamconf<DBClass, typeof schema>({
  DB: new DBClass(),
  schema,
  env,
})

export default dreamconf
