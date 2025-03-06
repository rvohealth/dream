import { Updateable } from 'kysely'
import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../Dream'
import STIChildMissing from '../../errors/sti/STIChildMissing'
import { UpdateablePropertiesForClass } from '../types'

export default function sqlResultToDreamInstance<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  Schema extends DreamInstance['schema'] = DreamInstance['schema'],
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<DreamClass>['table'],
  Table extends DB[TableName] = DB[TableName],
>(dreamClass: DreamClass, sqlResult: any): InstanceType<DreamClass> | Dream {
  if (dreamClass['isSTIBase']) {
    const extendingDreamClass = findExtendingDreamClass(dreamClass, sqlResult.type)

    if (!extendingDreamClass)
      throw new STIChildMissing(dreamClass, sqlResult.type, sqlResult[dreamClass.primaryKey])

    const dreamModel = new extendingDreamClass(sqlResult as Updateable<Table>, {
      bypassUserDefinedSetters: true,
      isPersisted: true,
      _internalUseOnly: true,
    })

    dreamModel['finalizeConstruction']()

    return dreamModel
  } else {
    const dreamModel = new dreamClass(sqlResult as UpdateablePropertiesForClass<Table>, {
      bypassUserDefinedSetters: true,
      isPersisted: true,
      _internalUseOnly: true,
    })

    dreamModel['finalizeConstruction']()

    return dreamModel
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
