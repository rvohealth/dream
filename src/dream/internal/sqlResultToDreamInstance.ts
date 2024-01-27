import { Updateable } from 'kysely'
import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../dream'
import STIChildMissing from '../../exceptions/sti/sti-child-missing'

// original function types:
// NOTE: these types were intenionally removed to reduce type complexity.
// if you are working on this method, and would like the assistance of the type
// helpers, feel free to uncomment this and use them to aid in improving this function.
// however, since this function is internal, we are leaving the types to reduce complexity.
//
// export default function sqlResultToDreamInstance<
//   DreamClass extends typeof Dream,
//   DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
//   SyncedAssociations extends DreamInstance['syncedAssociations'] = DreamInstance['syncedAssociations'],
//   DB extends DreamInstance['DB'] = DreamInstance['DB'],
//   TableName extends AssociationTableNames<DB, SyncedAssociations> &
//     keyof DB = InstanceType<DreamClass>['table'],
//   Table extends DB[TableName] = DB[TableName]
// >(dreamClass: DreamClass, sqlResult: any): InstanceType<DreamClass> | Dream {
export default function sqlResultToDreamInstance(dreamClass: any, sqlResult: any): any {
  if (dreamClass['isSTIBase']) {
    const extendingDreamClass = findExtendingDreamClass(dreamClass, sqlResult.type)

    if (!extendingDreamClass)
      throw new STIChildMissing(dreamClass, sqlResult.type, sqlResult[dreamClass.primaryKey])

    return extendingDreamClass.new(sqlResult)
  } else {
    return dreamClass.new(sqlResult)
  }
}

export function findExtendingDreamClass(dreamClass: typeof Dream, type: string): typeof Dream | undefined {
  if (!(dreamClass as any)['extendedBy']) return undefined

  const extendingDreamClass = (dreamClass as any)['extendedBy'].find(
    (extendingDreamClass: any) => extendingDreamClass.name === type
  )

  if (extendingDreamClass) return extendingDreamClass

  return (dreamClass as any)['extendedBy']
    .map((extendingDreamClass: any) => findExtendingDreamClass(extendingDreamClass, type))
    .find((dreamClassOrUndefined: any) => dreamClassOrUndefined)
}
