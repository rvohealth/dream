import Dream from '../../../src/dream'
import { DBClass, DBColumns, DBTypeCache, InterpretedDBClass } from '../../db/schema'
import SyncedAssociationsVal, {
  SyncedAssociations,
  SyncedBelongsToAssociations,
  VirtualColumns,
} from '../../db/associations'
import Dreamconf from '../../../src/dream/dreamconf'

export default class ApplicationModel extends Dream {
  public get DB() {
    return new DBClass()
  }

  public get interpretedDB(): InterpretedDBClass {
    return new InterpretedDBClass()
  }

  public get syncedAssociations(): SyncedAssociations {
    return SyncedAssociationsVal as SyncedAssociations
  }

  public get dbTypeCache(): typeof DBTypeCache {
    return DBTypeCache
  }

  public get dreamconf(): Dreamconf {
    return new Dreamconf({
      DB: new DBClass(),
      interpretedDB: new InterpretedDBClass(),
      syncedAssociations: SyncedAssociationsVal as SyncedAssociations,
      syncedBelongsToAssociations: {} as SyncedBelongsToAssociations,
      virtualColumns: {} as VirtualColumns,
      dbColumns: DBColumns,
      dbTypeCache: DBTypeCache,
      env: {
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
      },
    })
  }
}
