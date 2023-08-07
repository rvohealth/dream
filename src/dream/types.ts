import { DateTime } from 'luxon'
import { Updateable, ColumnType } from 'kysely'
import { AssociationTableNames } from '../db/reflections'
import { SyncedAssociations, SyncedAssociationNames, VirtualColumns } from '../sync/associations'
import Dream from '../dream'
import { Inc } from '../helpers/typeutils'
import { DB } from '../sync/schema'
import { AssociatedModelParam, WhereStatement } from '../decorators/associations/shared'

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

// includes
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
// end:includes

// joins
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
> = ArgumentType extends keyof PreviousSyncedAssociations & string
  ? (PreviousSyncedAssociations[ArgumentType & (keyof PreviousSyncedAssociations & string)] &
      string[])[number]
  : PreviousTableNames
// end:joins

// joinsPluck
export type NextJoinsWherePluckArgumentType<
  PreviousAssociationName,
  PreviousPreviousAssociationName,
  PreviousTableNames,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations]
> = PreviousTableNames extends undefined
  ? undefined
  : PreviousAssociationName extends `${any}.${any}` | any[]
  ? never
  : PreviousAssociationName extends SyncedAssociationNames[number]
  ?
      | keyof PreviousSyncedAssociations
      | WhereStatement<PreviousTableNames & AssociationTableNames>
      | AssociationNameToDotReference<PreviousAssociationName, PreviousTableNames & AssociationTableNames>
      | AssociationNameToDotReference<PreviousAssociationName, PreviousTableNames & AssociationTableNames>[]
  : PreviousAssociationName extends WhereStatement<any>
  ?
      | keyof PreviousSyncedAssociations
      | AssociationNameToDotReference<
          PreviousPreviousAssociationName,
          PreviousTableNames & AssociationTableNames
        >
      | AssociationNameToDotReference<
          PreviousPreviousAssociationName,
          PreviousTableNames & AssociationTableNames
        >[]
  : never
// end:joinsPluck

export type AssociationNameToDotReference<
  AssociationName,
  TableNames extends keyof SyncedAssociations & string
> = `${AssociationName & string}.${keyof Updateable<DB[TableNames & keyof DB]> & string}`

// type X = AssociationNameToDotReference<'mylar', 'beautiful_balloons'>
// type Y = X extends `${any}.${any}`
//   ? '`${any}.${any}` does match AssociationNameToDotReference'
//   : 'it doesn’t match'
// type Y = NextJoinsWherePluckArgumentType<WhereStatement<any>, 'mylar', 'beautiful_balloons'>

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
