import { ComparisonOperatorExpression as KyselyComparisonOperatorExpression } from 'kysely'
import { DateTime } from 'luxon'
import { Updateable, ColumnType } from 'kysely'
import { AssociationTableNames } from '../db/reflections'
import Dream from '../dream'
import { Inc } from '../helpers/typeutils'
import { AssociatedModelParam, WhereStatement } from '../decorators/associations/shared'
import OpsStatement from '../ops/ops-statement'

export const primaryKeyTypes = ['bigserial', 'bigint', 'uuid', 'integer'] as const
export type PrimaryKeyType = (typeof primaryKeyTypes)[number]

export type IdType = string | number | bigint | undefined
export type Timestamp = ColumnType<DateTime>

class Passthrough {
  constructor() {}
}

export const DreamConst = {
  passthrough: Passthrough,
}

export const TRIGRAM_OPERATORS = ['%', '<%', '<<%'] as const
export type TrigramOperator = (typeof TRIGRAM_OPERATORS)[number]
export type ComparisonOperatorExpression = KyselyComparisonOperatorExpression | TrigramOperator

// export interface AliasCondition<DB extends any, PreviousTableNames extends AssociationTableNames<DB>> {
//   conditionToExecute: boolean
//   alias: keyof SyncedAssociations[PreviousTableNames]
//   column: keyof Updateable<DB[PreviousTableNames]>
//   columnValue: any
// }

export type DreamColumn<
  I extends Dream,
  DB = I['DB'],
  TableName extends keyof DB = I['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
> = keyof Table & string

export type DreamTableSchema<DreamInstance extends Dream> = Updateable<
  DreamInstance['DB'][DreamInstance['table']]
>

export type DreamClassColumns<DreamClass extends typeof Dream> =
  keyof InstanceType<DreamClass>['DB'][InstanceType<DreamClass>['table']] & string

export type UpdateablePropertiesForClass<
  DreamClass extends typeof Dream,
  TableName extends AssociationTableNames<
    InstanceType<DreamClass>['DB'],
    InstanceType<DreamClass>['syncedAssociations']
  > &
    InstanceType<DreamClass>['table'] = InstanceType<DreamClass>['table'],
  VirtualColumns = InstanceType<DreamClass>['dreamconf']['virtualColumns'][TableName],
> = Partial<
  Updateable<InstanceType<DreamClass>['DB'][TableName]> &
    (VirtualColumns extends any[] ? Record<VirtualColumns[number], any> : {}) &
    (AssociatedModelParam<InstanceType<DreamClass>> extends never
      ? {}
      : AssociatedModelParam<InstanceType<DreamClass>>)
>

export type UpdateableAssociationProperties<
  DreamInstance extends Dream,
  AssociationClass extends Dream,
  AssociationTableName extends AssociationTableNames<
    DreamInstance['DB'],
    DreamInstance['syncedAssociations']
  > &
    keyof DreamInstance['DB'] = AssociationClass['table'],
  VirtualColumns = DreamInstance['dreamconf']['virtualColumns'][AssociationTableName],
> = Partial<
  Updateable<DreamInstance['DB'][AssociationTableName]> &
    (VirtualColumns extends any[] ? Record<VirtualColumns[number], any> : {}) &
    (AssociatedModelParam<AssociationClass> extends never ? {} : AssociatedModelParam<AssociationClass>)
>

export type AttributeKeys<
  I extends Dream,
  TableName extends AssociationTableNames<I['DB'], I['syncedAssociations']> & I['table'] = I['table'],
  VirtualColumns = I['dreamconf']['virtualColumns'][TableName],
> = keyof (Updateable<I['DB'][TableName]> &
  (VirtualColumns extends any[] ? Record<VirtualColumns[number], any> : {}))

export type UpdateableProperties<
  I extends Dream,
  TableName extends AssociationTableNames<I['DB'], I['syncedAssociations']> & I['table'] = I['table'],
  VirtualColumns = I['dreamconf']['virtualColumns'][TableName],
> = Partial<
  Updateable<I['DB'][TableName]> &
    (VirtualColumns extends any[] ? Record<VirtualColumns[number], any> : {}) &
    (AssociatedModelParam<I> extends never ? {} : AssociatedModelParam<I>)
>

export type DreamConstructorType<T extends Dream> = (new (...arguments_: any[]) => T) & typeof Dream

// preload
export type NextPreloadArgumentType<
  SyncedAssociations extends any,
  PreviousTableNames,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations],
> = PreviousTableNames extends undefined
  ? undefined
  : (keyof PreviousSyncedAssociations & string) | (keyof PreviousSyncedAssociations & string)[]

export type PreloadArgumentTypeAssociatedTableNames<
  SyncedAssociations extends any,
  PreviousTableNames,
  ArgumentType,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations],
> = ArgumentType extends string[]
  ? undefined
  : (PreviousSyncedAssociations[ArgumentType & (keyof PreviousSyncedAssociations & string)] &
      string[])[number]
// end:preload

// joins
export type NextJoinsWhereArgumentType<
  DB extends any,
  SyncedAssociations extends any,
  PreviousTableNames,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations],
> = PreviousTableNames extends undefined
  ? undefined
  :
      | (keyof PreviousSyncedAssociations & string)
      | WhereStatement<
          DB,
          SyncedAssociations,
          PreviousTableNames & AssociationTableNames<DB, SyncedAssociations> & keyof DB
        >

export type JoinsArgumentTypeAssociatedTableNames<
  DB extends any,
  SyncedAssociations extends any,
  PreviousTableNames,
  ArgumentType,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations],
> = ArgumentType extends `${any}.${any}`
  ? undefined
  : ArgumentType extends any[]
    ? undefined
    : ArgumentType extends WhereStatement<DB, SyncedAssociations, any>
      ? PreviousTableNames
      : (PreviousSyncedAssociations[ArgumentType & (keyof PreviousSyncedAssociations & string)] &
          string[])[number]
// end:joins

// pluckThrough
export type NextJoinsWherePluckArgumentType<
  DB extends any,
  SyncedAssociations extends any,
  PreviousAssociationName,
  PreviousPreviousAssociationName,
  PreviousTableNames,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations],
> = PreviousAssociationName extends undefined
  ? undefined
  : PreviousAssociationName extends `${any}.${any}`
    ? undefined
    : PreviousAssociationName extends any[]
      ? undefined
      : PreviousAssociationName extends WhereStatement<DB, SyncedAssociations, any>
        ?
            | keyof PreviousSyncedAssociations
            | AssociationNameToDotReference<
                DB,
                SyncedAssociations,
                PreviousPreviousAssociationName,
                PreviousTableNames &
                  AssociationTableNames<DB, SyncedAssociations> &
                  keyof SyncedAssociations &
                  string
              >
            | AssociationNameToDotReference<
                DB,
                SyncedAssociations,
                PreviousPreviousAssociationName,
                PreviousTableNames &
                  AssociationTableNames<DB, SyncedAssociations> &
                  keyof SyncedAssociations &
                  string
              >[]
        :
            | keyof PreviousSyncedAssociations
            | WhereStatement<
                DB,
                SyncedAssociations,
                PreviousTableNames & AssociationTableNames<DB, SyncedAssociations> & keyof DB
              >
            | AssociationNameToDotReference<
                DB,
                SyncedAssociations,
                PreviousAssociationName,
                PreviousTableNames &
                  AssociationTableNames<DB, SyncedAssociations> &
                  keyof SyncedAssociations &
                  string
              >
            | AssociationNameToDotReference<
                DB,
                SyncedAssociations,
                PreviousAssociationName,
                PreviousTableNames &
                  AssociationTableNames<DB, SyncedAssociations> &
                  keyof SyncedAssociations &
                  string
              >[]

// type X = NextJoinsWherePluckArgumentType<, 'pets'>
// type Y = ['pets.name', 'pets.id']
// type Z = Y extends X ? 'yes' : 'no'

export type FinalJoinsWherePluckArgumentType<
  DB extends any,
  SyncedAssociations extends any,
  PreviousAssociationName,
  PreviousPreviousAssociationName,
  PreviousTableNames,
> = PreviousAssociationName extends undefined
  ? undefined
  : PreviousAssociationName extends `${any}.${any}`
    ? undefined
    : PreviousAssociationName extends any[]
      ? undefined
      : PreviousAssociationName extends WhereStatement<DB, SyncedAssociations, any>
        ?
            | AssociationNameToDotReference<
                DB,
                SyncedAssociations,
                PreviousPreviousAssociationName,
                PreviousTableNames &
                  AssociationTableNames<DB, SyncedAssociations> &
                  keyof SyncedAssociations &
                  string
              >
            | AssociationNameToDotReference<
                DB,
                SyncedAssociations,
                PreviousPreviousAssociationName,
                PreviousTableNames &
                  AssociationTableNames<DB, SyncedAssociations> &
                  keyof SyncedAssociations &
                  string
              >[]
        :
            | AssociationNameToDotReference<
                DB,
                SyncedAssociations,
                PreviousAssociationName,
                PreviousTableNames &
                  AssociationTableNames<DB, SyncedAssociations> &
                  keyof SyncedAssociations &
                  string
              >
            | AssociationNameToDotReference<
                DB,
                SyncedAssociations,
                PreviousAssociationName,
                PreviousTableNames &
                  AssociationTableNames<DB, SyncedAssociations> &
                  keyof SyncedAssociations &
                  string
              >[]

// end:pluckThrough

export type AssociationNameToDotReference<
  DB extends any,
  SyncedAssociations extends any,
  AssociationName,
  TableNames extends keyof SyncedAssociations & string,
> = `${AssociationName & string}.${keyof Updateable<DB[TableNames & keyof DB]> & string}`

// type X = AssociationNameToDotReference<'mylar', 'beautiful_balloons'>
// type Y = X extends `${any}.${any}`
//   ? '`${any}.${any}` does match AssociationNameToDotReference'
//   : 'it doesn’t match'
// type Y = NextJoinsWherePluckArgumentType<WhereStatement<any, any, any>, 'mylar', 'beautiful_balloons'>

export type RelaxedPreloadStatement<Depth extends number = 0> = Depth extends 7
  ? {}
  : { [key: string]: RelaxedPreloadStatement<Inc<Depth>> | {} }

export type RelaxedJoinsStatement<Depth extends number = 0> = Depth extends 7
  ? {}
  : { [key: string]: RelaxedJoinsStatement<Inc<Depth>> | {} }

export type RelaxedJoinsWhereStatement<
  DB extends any,
  SyncedAssociations extends any,
  Depth extends number = 0,
> = Depth extends 7
  ? {}
  : {
      [key: string]: RelaxedPreloadStatement<Inc<Depth>> | {} | WhereStatement<DB, SyncedAssociations, any>
    }

export type TableOrAssociationName<SyncedAssociations extends any> =
  | (keyof SyncedAssociations & string)
  | (keyof SyncedAssociations[keyof SyncedAssociations] & string)

export type SqlCommandType = 'select' | 'update' | 'delete' | 'insert'

export interface SimilarityStatement {
  tableName: string
  tableAlias: string
  columnName: string
  opsStatement: OpsStatement<any, any>
}

export enum AssociationDepths {
  ONE = 'ONE',
  TWO = 'TWO',
  THREE = 'THREE',
  FOUR = 'FOUR',
  FIVE = 'FIVE',
  SIX = 'SIX',
  SEVEN = 'SEVEN',
  EIGHT = 'EIGHT',
}

export type GreaterThanOne =
  | AssociationDepths.TWO
  | AssociationDepths.THREE
  | AssociationDepths.FOUR
  | AssociationDepths.FIVE
  | AssociationDepths.SIX
  | AssociationDepths.SEVEN
  | AssociationDepths.EIGHT
export type GreaterThanTwo =
  | AssociationDepths.THREE
  | AssociationDepths.FOUR
  | AssociationDepths.FIVE
  | AssociationDepths.SIX
  | AssociationDepths.SEVEN
  | AssociationDepths.EIGHT
export type GreaterThanThree =
  | AssociationDepths.FOUR
  | AssociationDepths.FIVE
  | AssociationDepths.SIX
  | AssociationDepths.SEVEN
  | AssociationDepths.EIGHT
export type GreaterThanFour =
  | AssociationDepths.FIVE
  | AssociationDepths.SIX
  | AssociationDepths.SEVEN
  | AssociationDepths.EIGHT
export type GreaterThanFive = AssociationDepths.SIX | AssociationDepths.SEVEN | AssociationDepths.EIGHT
export type GreaterThanSix = AssociationDepths.SEVEN | AssociationDepths.EIGHT
export type GreaterThanSeven = AssociationDepths.EIGHT
