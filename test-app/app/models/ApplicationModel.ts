import Dream from '../../../src/dream'
import { DBClass, DBColumns, InterpretedDBClass } from '../../db/schema'
import SyncedAssociationsVal, { SyncedAssociations } from '../../db/associations'

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

  public get dbColumns(): typeof DBColumns {
    return DBColumns
  }
}
