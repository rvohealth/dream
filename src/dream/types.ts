import { Updateable } from 'kysely'
import { AssociationTableNames } from '../db/reflections'
import { SyncedAssociations, VirtualColumns } from '../sync/associations'
import Dream from '../dream'
import { Inc } from '../helpers/typeutils'
import { DB } from '../sync/schema'
import { AssociatedModelParam, WhereStatement } from '../decorators/associations/shared'

type MAX_DEPTH = 3

export type NestedAssociationExpression<
  TB extends AssociationTableNames,
  AssociationName extends keyof SyncedAssociations[TB],
  Next,
  Depth extends number
> = AssociationExpression<
  (SyncedAssociations[TB][AssociationName] & AssociationTableNames[])[number],
  Next,
  Depth
>

export type AssociationExpression<
  TB extends AssociationTableNames,
  AE = unknown,
  Depth extends number = 0
> = Depth extends MAX_DEPTH
  ? any
  : AE extends string
  ? keyof SyncedAssociations[TB]
  : AE extends any[]
  ? AssociationExpression<TB, AE[number], Inc<Depth>>[]
  : AE extends Partial<{
      [Property in keyof SyncedAssociations[TB]]: NestedAssociationExpression<TB, Property, any, Inc<Depth>>
    }>
  ? Partial<{
      [Property in keyof SyncedAssociations[TB]]: NestedAssociationExpression<
        TB,
        Property,
        AE[Property],
        Inc<Depth>
      >
    }>
  : never

export type JoinsWhereAssociationExpression<
  TB extends AssociationTableNames,
  AE extends AssociationExpression<TB, any>,
  Depth extends number = 0
> = Depth extends MAX_DEPTH
  ? any
  : AE extends keyof SyncedAssociations[TB]
  ? Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: WhereStatement<
        (SyncedAssociations[TB][AssociationName] & AssociationTableNames[])[number]
      >
    }>
  : AE extends any[]
  ? JoinsWhereAssociationExpression<TB, AE[number], Inc<Depth>>[]
  : AE extends Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: NestedAssociationExpression<
        TB,
        AssociationName,
        any,
        Inc<Depth>
      >
    }>
  ? Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: JoinsWhereAssociationExpression<
        (SyncedAssociations[TB][AssociationName] & AssociationTableNames[])[number],
        AssociationExpression<
          (SyncedAssociations[TB][AssociationName] & AssociationTableNames[])[number],
          AE[AssociationName]
        >,
        Inc<Depth>
      >
    }>
  : never

type PluckTypeFromAssociationName<
  TB extends AssociationTableNames,
  AssociationName extends keyof SyncedAssociations[TB]
> = SyncedAssociations[TB][AssociationName] extends (keyof DB)[]
  ? `${AssociationName & string}.${keyof DB[SyncedAssociations[TB][AssociationName][number]] & string}`
  : SyncedAssociations[TB][AssociationName] extends keyof DB
  ? `${AssociationName & string}.${keyof DB[SyncedAssociations[TB][AssociationName]] & string}`
  : never

type NestedPluckTypeFromAssociationExpression<
  TB extends AssociationTableNames,
  AssociationName extends keyof SyncedAssociations[TB],
  AE extends Partial<{
    [AssociationName in keyof SyncedAssociations[TB]]: NestedAssociationExpression<
      TB,
      AssociationName,
      any,
      Inc<Depth>
    >
  }>,
  Depth extends number
> = SyncedAssociations[TB][AssociationName] extends (keyof DB)[]
  ? JoinsPluckAssociationExpression<
      SyncedAssociations[TB][AssociationName][number],
      AssociationExpression<SyncedAssociations[TB][AssociationName][number], AE[AssociationName]>,
      Inc<Depth>
    >
  : SyncedAssociations[TB][AssociationName] extends keyof DB
  ? JoinsPluckAssociationExpression<
      SyncedAssociations[TB][AssociationName],
      AssociationExpression<SyncedAssociations[TB][AssociationName], AE[AssociationName]>,
      Inc<Depth>
    >
  : never

export type JoinsPluckAssociationExpression<
  TB extends AssociationTableNames,
  AE extends AssociationExpression<TB, any>,
  Depth extends number = 0
> = Depth extends MAX_DEPTH
  ? any
  : AE extends keyof SyncedAssociations[TB]
  ? PluckTypeFromAssociationName<TB, AE>
  : AE extends any[]
  ? JoinsPluckAssociationExpression<TB, AE[number], Inc<Depth>>[]
  : AE extends Partial<{
      [AssociationName in keyof SyncedAssociations[TB]]: NestedAssociationExpression<
        TB,
        AssociationName,
        any,
        Inc<Depth>
      >
    }>
  ?
      | PluckTypeFromAssociationName<TB, keyof SyncedAssociations[TB]>
      | NestedPluckTypeFromAssociationExpression<TB, keyof SyncedAssociations[TB], AE, Inc<Depth>>
  : never

export interface AliasCondition<PreviousTableName extends AssociationTableNames> {
  conditionToExecute: boolean
  alias: keyof SyncedAssociations[PreviousTableName]
  column: keyof Updateable<DB[PreviousTableName]>
  columnValue: any
}

export type UpdateableFields<DreamClass extends typeof Dream> =
  | Updateable<DB[InstanceType<DreamClass>['table'] & AssociationTableNames]>
  | AssociatedModelParam<InstanceType<DreamClass>>
  | (VirtualColumns[InstanceType<DreamClass>['table'] & keyof VirtualColumns] extends any[]
      ? Record<VirtualColumns[InstanceType<DreamClass>['table'] & keyof VirtualColumns][number], any>
      : never)

export type UpdateableInstanceFields<I extends Dream> =
  | Updateable<DB[I['table'] & AssociationTableNames]>
  | AssociatedModelParam<I>
  | (VirtualColumns[I['table'] & keyof VirtualColumns] extends any[]
      ? Record<VirtualColumns[I['table'] & keyof VirtualColumns][number], any>
      : never)

export type DreamConstructorType<T extends Dream> = (new (...arguments_: any[]) => T) & typeof Dream
