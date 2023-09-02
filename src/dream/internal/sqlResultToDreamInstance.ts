import { Updateable } from 'kysely'
import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../dream'
import { DB } from '../../sync/schema'
import STIChildMissing from '../../exceptions/sti/sti-child-missing'

export default function sqlResultToDreamInstance<
  DreamClass extends typeof Dream,
  TableName extends AssociationTableNames = InstanceType<DreamClass>['table'],
  Table = DB[TableName]
>(dreamClass: DreamClass, sqlResult: any): InstanceType<DreamClass> | Dream {
  if (dreamClass.isSTIBase) {
    const extendingDreamClass = findExtendingDreamClass(dreamClass, sqlResult.type)

    if (!extendingDreamClass)
      throw new STIChildMissing(dreamClass, sqlResult.type, sqlResult[dreamClass.primaryKey])

    return new extendingDreamClass(sqlResult as Updateable<Table>)
  } else {
    return new dreamClass(sqlResult as Updateable<Table>)
  }
}

export function findExtendingDreamClass(dreamClass: typeof Dream, type: string): typeof Dream | undefined {
  if (!dreamClass.extendedBy) return undefined

  const extendingDreamClass = dreamClass.extendedBy.find(
    extendingDreamClass => extendingDreamClass.name === type
  )

  if (extendingDreamClass) return extendingDreamClass

  return dreamClass.extendedBy
    .map(extendingDreamClass => findExtendingDreamClass(extendingDreamClass, type))
    .find(dreamClassOrUndefined => dreamClassOrUndefined)
}
