import Dream from '../../../src/dream'
import { DBClass, DBColumns, DBTypeCache, InterpretedDBClass } from '../../db/schema'
import SyncedAssociationsVal, {
  SyncedAssociations,
  SyncedBelongsToAssociations,
  VirtualColumns,
} from '../../db/associations'
import Dreamconf, { AssociationDepths } from '../../../shared/dreamconf'
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

  public get dreamconf(): Dreamconf<
    DBClass,
    InterpretedDBClass,
    SyncedAssociations,
    SyncedBelongsToAssociations,
    VirtualColumns,
    typeof DBColumns,
    typeof DBTypeCache
  > {
    return dreamconf
  }
}
