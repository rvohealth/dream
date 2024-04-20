import { Updateable } from 'kysely'
import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../dream'
import STIChildMissing from '../../exceptions/sti/sti-child-missing'
import { UpdateablePropertiesForClass } from '../types'

export default function sqlResultToDreamInstance<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  Schema extends DreamInstance['dreamconf']['schema'] = DreamInstance['dreamconf']['schema'],
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<DreamClass>['table'],
  Table extends DB[TableName] = DB[TableName],
>(dreamClass: DreamClass, sqlResult: any): InstanceType<DreamClass> | Dream {
  if (dreamClass['isSTIBase']) {
    const extendingDreamClass = findExtendingDreamClass(dreamClass, sqlResult.type)

    if (!extendingDreamClass)
      throw new STIChildMissing(dreamClass, sqlResult.type, sqlResult[dreamClass.primaryKey])

    return extendingDreamClass.new(sqlResult as Updateable<Table>, { bypassUserDefinedSetters: true })
  } else {
    return dreamClass.new(sqlResult as UpdateablePropertiesForClass<Table>, {
      bypassUserDefinedSetters: true,
    })
  }
}

export function findExtendingDreamClass(dreamClass: typeof Dream, type: string): typeof Dream | undefined {
  if (!dreamClass['extendedBy']) return undefined

  const extendingDreamClass = dreamClass['extendedBy'].find(
    extendingDreamClass => extendingDreamClass.name === type
  )

  if (extendingDreamClass) return extendingDreamClass

  return dreamClass['extendedBy']
    .map(extendingDreamClass => findExtendingDreamClass(extendingDreamClass, type))
    .find(dreamClassOrUndefined => dreamClassOrUndefined)
}
