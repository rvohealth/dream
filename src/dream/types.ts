import { DateTime } from 'luxon'
import { Updateable, ColumnType } from 'kysely'
import { AssociationTableNames } from '../db/reflections'
import { SyncedAssociations, SyncedAssociationsToTables, VirtualColumns } from '../sync/associations'
import Dream from '../dream'
import { Inc } from '../helpers/typeutils'
import { DB } from '../sync/schema'
import { AssociatedModelParam, WhereStatement } from '../decorators/associations/shared'

type MAX_DEPTH = 2

export type IdType = string | number | bigint | undefined
export type Timestamp = ColumnType<DateTime>

export interface AliasCondition<PreviousTableNames extends AssociationTableNames> {
  conditionToExecute: boolean
  alias: keyof SyncedAssociations[PreviousTableNames]
  column: keyof Updateable<DB[PreviousTableNames]>
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

export type NextIncludesArgumentType<
  PreviousTableNames,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations]
> = PreviousTableNames extends undefined
  ? undefined
  : (keyof PreviousSyncedAssociations & string) | (keyof PreviousSyncedAssociations & string)[]

export type IncludesArgumentTypeAssociatedTableNames<
  PreviousTableNames,
  ArgumentType,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations]
> = ArgumentType extends string[]
  ? undefined
  : (PreviousSyncedAssociations[ArgumentType & (keyof PreviousSyncedAssociations & string)] &
      string[])[number]

export type NextJoinsWhereArgumentType<
  PreviousTableNames,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations]
> = PreviousTableNames extends undefined
  ? undefined
  : (keyof PreviousSyncedAssociations & string) | WhereStatement<PreviousTableNames & AssociationTableNames>

export type JoinsArgumentTypeAssociatedTableNames<
  PreviousTableNames,
  ArgumentType,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations]
> = ArgumentType extends WhereStatement<any>
  ? PreviousTableNames
  : (PreviousSyncedAssociations[ArgumentType & (keyof PreviousSyncedAssociations & string)] &
      string[])[number]

export type RelaxedIncludesStatement<Depth extends number = 0> = Depth extends 7
  ? {}
  : { [key: string]: RelaxedIncludesStatement<Inc<Depth>> | {} }

export type RelaxedJoinsStatement<Depth extends number = 0> = Depth extends 7
  ? {}
  : { [key: string]: RelaxedJoinsStatement<Inc<Depth>> | {} }

export type RelaxedJoinsWhereStatement<Depth extends number = 0> = Depth extends 7
  ? {}
  : {
      [key: string]: RelaxedIncludesStatement<Inc<Depth>> | {} | WhereStatement<any>
    }
