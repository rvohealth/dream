import { Updateable } from 'kysely'
import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../dream'
import { DB } from '../../sync/schema'
import STIChildMissing from '../../exceptions/sti/sti-child-missing'

export default function sqlResultToDreamInstance<
  DreamClass extends typeof Dream,
  TableName extends AssociationTableNames = InstanceType<DreamClass>['table'],
  Table = DB[TableName]
>(dreamClass: DreamClass, sqlResult: any) {
  if (dreamClass.extendedBy) {
    const extendingDreamClass = dreamClass.extendedBy.find(
      extendingDreamClass => extendingDreamClass.name === sqlResult.type
    )

    if (!extendingDreamClass)
      throw new STIChildMissing(dreamClass, sqlResult.type, sqlResult[dreamClass.primaryKey])

    return new extendingDreamClass(sqlResult as Updateable<Table>)
  } else {
    return new dreamClass(sqlResult as Updateable<Table>)
  }
}
