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

// preload
export type NextPreloadArgumentType<
  PreviousTableNames,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations]
> = PreviousTableNames extends undefined
  ? undefined
  : (keyof PreviousSyncedAssociations & string) | (keyof PreviousSyncedAssociations & string)[]

export type PreloadArgumentTypeAssociatedTableNames<
  PreviousTableNames,
  ArgumentType,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations]
> = ArgumentType extends string[]
  ? undefined
  : (PreviousSyncedAssociations[ArgumentType & (keyof PreviousSyncedAssociations & string)] &
      string[])[number]
// end:preload

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
> = ArgumentType extends `${any}.${any}`
  ? undefined
  : ArgumentType extends any[]
  ? undefined
  : ArgumentType extends WhereStatement<any>
  ? PreviousTableNames
  : (PreviousSyncedAssociations[ArgumentType & (keyof PreviousSyncedAssociations & string)] &
      string[])[number]
// end:joins

// joinsPluck
export type NextJoinsWherePluckArgumentType<
  PreviousAssociationName,
  PreviousPreviousAssociationName,
  PreviousTableNames,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations]
> = PreviousAssociationName extends undefined
  ? undefined
  : PreviousAssociationName extends `${any}.${any}`
  ? undefined
  : PreviousAssociationName extends any[]
  ? undefined
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
  :
      | keyof PreviousSyncedAssociations
      | WhereStatement<PreviousTableNames & AssociationTableNames>
      | AssociationNameToDotReference<PreviousAssociationName, PreviousTableNames & AssociationTableNames>
      | AssociationNameToDotReference<PreviousAssociationName, PreviousTableNames & AssociationTableNames>[]

// type X = NextJoinsWherePluckArgumentType<, 'pets'>
// type Y = ['pets.name', 'pets.id']
// type Z = Y extends X ? 'yes' : 'no'

export type FinalJoinsWherePluckArgumentType<PreviousAssociationName, PreviousTableNames> =
  PreviousAssociationName extends undefined
    ? undefined
    : PreviousAssociationName extends `${any}.${any}`
    ? undefined
    : PreviousAssociationName extends any[]
    ? undefined
    :
        | AssociationNameToDotReference<PreviousAssociationName, PreviousTableNames & AssociationTableNames>
        | AssociationNameToDotReference<PreviousAssociationName, PreviousTableNames & AssociationTableNames>[]
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

export type RelaxedPreloadStatement<Depth extends number = 0> = Depth extends 7
  ? {}
  : { [key: string]: RelaxedPreloadStatement<Inc<Depth>> | {} }

export type RelaxedJoinsStatement<Depth extends number = 0> = Depth extends 7
  ? {}
  : { [key: string]: RelaxedJoinsStatement<Inc<Depth>> | {} }

export type RelaxedJoinsWhereStatement<Depth extends number = 0> = Depth extends 7
  ? {}
  : {
      [key: string]: RelaxedPreloadStatement<Inc<Depth>> | {} | WhereStatement<any>
    }
