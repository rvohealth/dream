import Dreamconf from '../../../src/helpers/dreamconf'
import SyncedAssociationsVal, {
  SyncedAssociations,
  SyncedBelongsToAssociations,
  VirtualColumns,
} from '../../db/associations'
import { DBClass, DBColumns, DBTypeCache, InterpretedDBClass } from '../../db/schema'

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

const dreamconf = new Dreamconf<
  DBClass,
  InterpretedDBClass,
  SyncedAssociations,
  SyncedBelongsToAssociations,
  typeof VirtualColumns,
  typeof DBColumns,
  typeof DBTypeCache
>({
  DB: new DBClass(),
  interpretedDB: new InterpretedDBClass(),
  syncedAssociations: SyncedAssociationsVal as SyncedAssociations,
  syncedBelongsToAssociations: {} as SyncedBelongsToAssociations,
  virtualColumns: VirtualColumns,
  dbColumns: DBColumns,
  dbTypeCache: DBTypeCache,
  env,
})

export default dreamconf
