import { Updateable } from 'kysely'
import Dream from '../../Dream.js'
import STIChildMissing from '../../errors/sti/STIChildMissing.js'
import { AssociationTableNames } from '../../types/db.js'
import { UpdateablePropertiesForClass } from '../../types/dream.js'
import filterRowToKnownColumns from './filterRowToKnownColumns.js'

export default function sqlResultToDreamInstance<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  Schema extends DreamInstance['schema'] = DreamInstance['schema'],
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<DreamClass>['table'],
  Table extends DB[TableName] = DB[TableName],
>(dreamClass: DreamClass, sqlResult: any): InstanceType<DreamClass> | Dream {
  // base-model reads select `*`, so under schema/image skew (or with a
  // column declared in ignoredColumns but not yet dropped) the row can
  // contain columns the compiled schema doesn't know about. Passing such
  // keys into the constructor would assign them as plain properties —
  // invoking a same-named user-defined setter, or throwing on a
  // getter-only property — so they are dropped before hydration.
  if (dreamClass['isSTIBase']) {
    const extendingDreamClass = findExtendingDreamClass(dreamClass, sqlResult.type)

    if (!extendingDreamClass)
      throw new STIChildMissing(dreamClass, sqlResult.type, sqlResult[dreamClass.primaryKey])

    const dreamModel = new extendingDreamClass(
      filterRowToKnownColumns(sqlResult, extendingDreamClass.columns()) as Updateable<Table>,
      {
        bypassUserDefinedSetters: true,
        isPersisted: true,
        _internalUseOnly: true,
      }
    )

    dreamModel['finalizeConstruction']()

    return dreamModel
  } else {
    const dreamModel = new dreamClass(
      filterRowToKnownColumns(sqlResult, dreamClass.columns()) as UpdateablePropertiesForClass<Table>,
      {
        bypassUserDefinedSetters: true,
        isPersisted: true,
        _internalUseOnly: true,
      }
    )

    dreamModel['finalizeConstruction']()

    return dreamModel
  }
}

export function findExtendingDreamClass(dreamClass: typeof Dream, type: string): typeof Dream | undefined {
  if (!dreamClass['extendedBy']) return undefined

  const extendingDreamClass = dreamClass['extendedBy'].find(
    extendingDreamClass => extendingDreamClass.sanitizedName === type
  )

  if (extendingDreamClass) return extendingDreamClass

  return dreamClass['extendedBy']
    .map(extendingDreamClass => findExtendingDreamClass(extendingDreamClass, type))
    .find(dreamClassOrUndefined => dreamClassOrUndefined)
}
