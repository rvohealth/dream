import Dream from '../../../src/dream'
import { AllColumns, DBClass, DBColumns, DBTypeCache, InterpretedDBClass } from '../../db/schema'
import SyncedAssociationsVal, {
  SyncedAssociations,
  SyncedBelongsToAssociations,
  VirtualColumns,
} from '../../db/associations'
import Dreamconf, { AssociationDepths } from '../../../src/helpers/dreamconf'
import dreamconf from '../conf/dreamconf'

export default class ApplicationModel extends Dream {
  public get maxAssociationTypeDepth() {
    return AssociationDepths.EIGHT as const
  }

  public get DB() {
    return new DBClass()
  }

  public get syncedAssociations(): SyncedAssociations {
    return SyncedAssociationsVal as SyncedAssociations
  }

  public get allColumns(): typeof AllColumns {
    return AllColumns
  }

  public get dreamconf(): Dreamconf<
    DBClass,
    InterpretedDBClass,
    SyncedAssociations,
    SyncedBelongsToAssociations,
    typeof VirtualColumns,
    typeof DBColumns,
    typeof DBTypeCache
  > {
    return dreamconf
  }
}
