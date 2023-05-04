import { Updateable } from 'kysely'
import { AssociationTableNames } from '../db/reflections'
import { SyncedAssociations, SyncedBelongsToAssociations } from '../sync/associations'
import Dream from '../dream'
import { Inc } from '../helpers/typeutils'
import { DB } from '../sync/schema'

export type NestedAssociationExpression<
  TB extends AssociationTableNames,
  Property extends keyof SyncedAssociations[TB],
  Next
> = AssociationExpression<(SyncedAssociations[TB][Property] & AssociationTableNames[])[number], Next>

export type AssociationExpression<
  TB extends AssociationTableNames,
  AE = unknown,
  Depth extends number = 0
> = Depth extends 5
  ? never
  : AE extends string
  ? keyof SyncedAssociations[TB]
  : AE extends any[]
  ? AssociationExpression<TB, AE[number], Inc<Depth>>[]
  : AE extends Partial<{
      [Property in keyof SyncedAssociations[TB]]: NestedAssociationExpression<TB, Property, any>
    }>
  ? Partial<{
      [Property in keyof SyncedAssociations[TB]]: NestedAssociationExpression<TB, Property, AE[Property]>
    }>
  : never

export type JoinsWhereAssociationExpression<
  TB extends AssociationTableNames,
  AE extends AssociationExpression<TB, any>,
  Depth extends number = 0
> = Depth extends 5
  ? never
  : AE extends any[]
  ? JoinsWhereAssociationExpression<TB, AE[number], Inc<Depth>>[]
  : AE extends keyof SyncedAssociations[TB]
  ? Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: Updateable<
        DB[(SyncedAssociations[TB][AssociationName] & AssociationTableNames[])[number]]
      >
    }>
  : AE extends Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: NestedAssociationExpression<TB, AssociationName, any>
    }>
  ? Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: JoinsWhereAssociationExpression<
        (SyncedAssociations[TB][AssociationName] & AssociationTableNames[])[number],
        NestedAssociationExpression<TB, AssociationName, AE[AssociationName]>
      >
    }>
  : never

export type AssociationModelParam<
  DreamInstance extends Dream,
  BelongsToModelAssociationNames extends keyof SyncedBelongsToAssociations[DreamInstance['table']]
> = Partial<
  Record<
    BelongsToModelAssociationNames,
    ReturnType<
      DreamInstance['associationMap'][keyof DreamInstance['associationMap']]['modelCB']
    > extends () => (typeof Dream)[]
      ? InstanceType<
          ReturnType<
            DreamInstance['associationMap'][keyof DreamInstance['associationMap']]['modelCB'] &
              (() => (typeof Dream)[])
          >[number]
        >
      : InstanceType<
          ReturnType<
            DreamInstance['associationMap'][keyof DreamInstance['associationMap']]['modelCB'] &
              (() => typeof Dream)
          >
        >
  >
>
export interface AliasCondition<PreviousTableName extends AssociationTableNames> {
  conditionToExecute: boolean
  alias: keyof SyncedAssociations[PreviousTableName]
  column: keyof Updateable<DB[PreviousTableName]>
  columnValue: any
}

export type DreamConstructorType<T extends Dream> = (new (...arguments_: any[]) => T) & typeof Dream
