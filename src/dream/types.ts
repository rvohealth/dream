import { ComparisonOperatorExpression as KyselyComparisonOperatorExpression } from 'kysely'
import { DateTime } from 'luxon'
import { Updateable, ColumnType } from 'kysely'
import { AssociationTableNames } from '../db/reflections'
import Dream from '../dream'
import { Inc, Tail } from '../helpers/typeutils'
import { AssociatedModelParam, WhereStatement } from '../decorators/associations/shared'
import OpsStatement from '../ops/ops-statement'
import { FindEachOpts } from './query'

export const primaryKeyTypes = ['bigserial', 'bigint', 'uuid', 'integer'] as const
export type PrimaryKeyType = (typeof primaryKeyTypes)[number]

export type IdType = string | number | bigint | undefined
export type Timestamp = ColumnType<DateTime>

type MAX_VARIADIC_DEPTH = 25

class Passthrough {
  constructor() {}
}

export const DreamConst = {
  passthrough: Passthrough,
}

export const TRIGRAM_OPERATORS = ['%', '<%', '<<%'] as const
export type TrigramOperator = (typeof TRIGRAM_OPERATORS)[number]
export type ComparisonOperatorExpression = KyselyComparisonOperatorExpression | TrigramOperator
export type OrderDir = 'asc' | 'desc'

// export interface AliasCondition<DB extends any, PreviousTableNames extends AssociationTableNames<DB>> {
//   conditionToExecute: boolean
//   alias: keyof SyncedAssociations[PreviousTableNames]
//   column: keyof Updateable<DB[PreviousTableNames]>
//   columnValue: any
// }

export type DreamColumns<
  DreamInstance extends Dream,
  DB = DreamInstance['DB'],
  TableName extends keyof DB = DreamInstance['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
> = keyof Table & string

export type DreamClassColumns<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB = DreamInstance['DB'],
  TableName extends keyof DB = DreamInstance['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
> = keyof Table & string

export type DreamColumn<
  DreamInstance extends Dream,
  Column extends keyof InterpretedDB[TableName],
  InterpretedDB extends
    DreamInstance['dreamconf']['interpretedDB'] = DreamInstance['dreamconf']['interpretedDB'],
  TableName extends keyof InterpretedDB = DreamInstance['table'] & keyof InterpretedDB,
> = InterpretedDB[TableName][Column & keyof InterpretedDB[TableName]]

export type DreamClassColumn<
  DreamClass extends typeof Dream,
  Column extends keyof InterpretedDB[TableName],
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  InterpretedDB extends
    DreamInstance['dreamconf']['interpretedDB'] = DreamInstance['dreamconf']['interpretedDB'],
  TableName extends keyof InterpretedDB = DreamInstance['table'] & keyof InterpretedDB,
> = DreamColumn<DreamInstance, Column>

export type DreamTableSchema<DreamInstance extends Dream> = Updateable<
  DreamInstance['DB'][DreamInstance['table']]
>

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
    (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object) &
    (AssociatedModelParam<InstanceType<DreamClass>> extends never
      ? object
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
    (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object) &
    (AssociatedModelParam<AssociationClass> extends never ? object : AssociatedModelParam<AssociationClass>)
>

export type AttributeKeys<
  I extends Dream,
  TableName extends AssociationTableNames<I['DB'], I['syncedAssociations']> & I['table'] = I['table'],
  VirtualColumns = I['dreamconf']['virtualColumns'][TableName],
> = keyof (Updateable<I['DB'][TableName]> &
  (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object))

export type UpdateableProperties<
  I extends Dream,
  TableName extends AssociationTableNames<I['DB'], I['syncedAssociations']> & I['table'] = I['table'],
  VirtualColumns = I['dreamconf']['virtualColumns'][TableName],
> = Partial<
  Updateable<I['DB'][TableName]> &
    (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object) &
    (AssociatedModelParam<I> extends never ? object : AssociatedModelParam<I>)
>

export type DreamConstructorType<T extends Dream> = (new (...arguments_: any[]) => T) & typeof Dream

// preload
export type NextPreloadArgumentType<
  SyncedAssociations,
  PreviousTableNames,
  PreviousSyncedAssociations = PreviousTableNames extends undefined
    ? undefined
    : SyncedAssociations[PreviousTableNames & keyof SyncedAssociations],
> = PreviousTableNames extends undefined
  ? undefined
  : (keyof PreviousSyncedAssociations & string) | (keyof PreviousSyncedAssociations & string)[]

export type PreloadArgumentTypeAssociatedTableNames<
  SyncedAssociations,
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

export type AssociationNameToDotReference<
  DB,
  SyncedAssociations,
  AssociationName,
  TableNames extends keyof SyncedAssociations & string,
> = `${AssociationName & string}.${keyof Updateable<DB[TableNames & keyof DB]> & string}`

// type X = AssociationNameToDotReference<'mylar', 'beautiful_balloons'>
// type Y = X extends `${any}.${any}`
//   ? '`${any}.${any}` does match AssociationNameToDotReference'
//   : 'it doesn’t match'
// type Y = NextJoinsWherePluckArgumentType<WhereStatement<any, any, any>, 'mylar', 'beautiful_balloons'>

export type RelaxedPreloadStatement<Depth extends number = 0> = Depth extends 7
  ? object
  : { [key: string]: RelaxedPreloadStatement<Inc<Depth>> | object }

export type RelaxedJoinsStatement<Depth extends number = 0> = Depth extends 7
  ? object
  : { [key: string]: RelaxedJoinsStatement<Inc<Depth>> | object }

export type RelaxedJoinsWhereStatement<DB, SyncedAssociations, Depth extends number = 0> = Depth extends 7
  ? object
  : {
      [key: string]:
        | RelaxedPreloadStatement<Inc<Depth>>
        | object
        | WhereStatement<DB, SyncedAssociations, any>
    }

export type TableOrAssociationName<SyncedAssociations> =
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

type VALID = 'valid'
type INVALID = 'invalid'

///////////////////////////////
// VARIADIC LOAD
///////////////////////////////
type VariadicLoadArgsCheckThenRecurse<
  SyncedAssociations extends object,
  ConcreteTableName extends keyof SyncedAssociations & string,
  ConcreteArgs extends readonly unknown[],
  UsedNamespaces,
  Depth extends number,
  AssociationNamesOrWhereClause,
  NthArgument extends VALID | INVALID = ConcreteArgs['length'] extends 0
    ? VALID
    : ConcreteArgs[0] extends keyof SyncedAssociations[ConcreteTableName] & string
      ? VALID
      : INVALID,
> = NthArgument extends INVALID
  ? `invalid where clause in argument ${Inc<Depth>}`
  : ConcreteArgs['length'] extends 0
    ? AssociationNamesOrWhereClause
    : VariadicLoadArgsRecurse<SyncedAssociations, ConcreteTableName, ConcreteArgs, UsedNamespaces, Depth>

type VariadicLoadArgsRecurse<
  SyncedAssociations extends object,
  ConcreteTableName extends keyof SyncedAssociations & string,
  ConcreteArgs extends readonly unknown[],
  UsedNamespaces,
  Depth extends number,
  //
  ConcreteNthArg extends keyof SyncedAssociations[ConcreteTableName] &
    string = ConcreteArgs[0] extends keyof SyncedAssociations[ConcreteTableName] & string
    ? ConcreteArgs[0] & keyof SyncedAssociations[ConcreteTableName] & string
    : never,
  NextUsedNamespaces = ConcreteArgs[0] extends keyof SyncedAssociations[ConcreteTableName] & string
    ? UsedNamespaces | ConcreteNthArg
    : UsedNamespaces,
  //
  NextTableName extends keyof SyncedAssociations &
    string = ConcreteNthArg extends keyof SyncedAssociations[ConcreteTableName] & string
    ? SyncedAssociations[ConcreteTableName][ConcreteNthArg] extends any[]
      ? SyncedAssociations[ConcreteTableName][ConcreteNthArg][0] & keyof SyncedAssociations & string
      : never
    : ConcreteTableName,
  AllowedNextArgValues = Exclude<keyof SyncedAssociations[NextTableName] & string, NextUsedNamespaces>,
  //
> = Depth extends MAX_VARIADIC_DEPTH
  ? never
  : VariadicLoadArgsCheckThenRecurse<
      SyncedAssociations,
      NextTableName,
      Tail<ConcreteArgs>,
      NextUsedNamespaces,
      Inc<Depth>,
      AllowedNextArgValues | AllowedNextArgValues[]
    >

export type VariadicLoadArgs<
  SyncedAssociations extends object,
  ConcreteTableName extends keyof SyncedAssociations & string,
  ConcreteArgs extends readonly unknown[],
  //
  AllowedNextArgValues = keyof SyncedAssociations[ConcreteTableName] & string,
> = VariadicLoadArgsCheckThenRecurse<
  SyncedAssociations,
  ConcreteTableName,
  ConcreteArgs,
  never,
  0,
  AllowedNextArgValues | AllowedNextArgValues[]
>
///////////////////////////////
// end: VARIADIC LOAD
///////////////////////////////

///////////////////////////////
// VARIADIC JOINS
///////////////////////////////
export type VariadicJoinsArgs<
  DB,
  SyncedAssociations extends object,
  ConcreteTableName extends keyof SyncedAssociations & string,
  ConcreteArgs extends readonly unknown[],
  //
  AllowedNextArgValues = keyof SyncedAssociations[ConcreteTableName] & string,
> = VariadicCheckThenRecurse<
  DB,
  SyncedAssociations,
  ConcreteTableName,
  ConcreteArgs,
  'joins',
  never,
  0,
  never,
  AllowedNextArgValues
>
///////////////////////////////
// end: VARIADIC JOINS
///////////////////////////////

///////////////////////////////
// VARIADIC PLUCK THROUGH
///////////////////////////////
export type VariadicPluckThroughArgs<
  DB,
  SyncedAssociations extends object,
  ConcreteTableName extends keyof SyncedAssociations & string,
  ConcreteArgs extends readonly unknown[],
  AllowedNextArgValues = keyof SyncedAssociations[ConcreteTableName] & string,
> = VariadicCheckThenRecurse<
  DB,
  SyncedAssociations,
  ConcreteTableName,
  ConcreteArgs,
  'pluckThrough',
  never,
  0,
  never,
  AllowedNextArgValues
>
///////////////////////////////
// end: VARIADIC PLUCK THROUGH
///////////////////////////////

///////////////////////////////
// VARIADIC PLUCK EACH THROUGH
///////////////////////////////
export type VariadicPluckEachThroughArgs<
  DB,
  SyncedAssociations extends object,
  ConcreteTableName extends keyof SyncedAssociations & string,
  ConcreteArgs extends readonly unknown[],
  AllowedNextArgValues = keyof SyncedAssociations[ConcreteTableName] & string,
> = VariadicCheckThenRecurse<
  DB,
  SyncedAssociations,
  ConcreteTableName,
  ConcreteArgs,
  'pluckEachThrough',
  never,
  0,
  never,
  AllowedNextArgValues
>
///////////////////////////////
// end: VARIADIC PLUCK EACH THROUGH
///////////////////////////////

type VariadicCheckThenRecurse<
  DB,
  SyncedAssociations extends object,
  ConcreteTableName extends keyof SyncedAssociations & string,
  ConcreteArgs extends readonly unknown[],
  RecursionType extends RecursionTypes,
  UsedNamespaces,
  Depth extends number,
  //
  ConcreteAssociationName,
  //
  AssociationNamesOrWhereClause,
  NthArgument extends VALID | INVALID = ConcreteArgs['length'] extends 0
    ? VALID
    : ConcreteArgs[0] extends keyof SyncedAssociations[ConcreteTableName] & string
      ? VALID
      : ConcreteArgs[0] extends WhereStatement<
            DB,
            SyncedAssociations,
            ConcreteTableName & AssociationTableNames<DB, SyncedAssociations> & keyof DB
          >
        ? VALID
        : RecursionType extends 'joins'
          ? INVALID
          : ConcreteArgs[0] extends AssociationNameToDotReference<
                DB,
                SyncedAssociations,
                ConcreteAssociationName,
                ConcreteTableName &
                  AssociationTableNames<DB, SyncedAssociations> &
                  keyof SyncedAssociations &
                  string
              >
            ? VALID
            : ConcreteArgs[0] extends readonly AssociationNameToDotReference<
                  DB,
                  SyncedAssociations,
                  ConcreteAssociationName,
                  ConcreteTableName &
                    AssociationTableNames<DB, SyncedAssociations> &
                    keyof SyncedAssociations &
                    string
                >[]
              ? VALID
              : RecursionType extends 'pluckThrough'
                ? INVALID
                : ConcreteArgs[0] extends (...args: any[]) => Promise<void> | void
                  ? VALID
                  : INVALID,
> = NthArgument extends INVALID
  ? `invalid where clause in argument ${Inc<Depth>}`
  : ConcreteArgs['length'] extends 0
    ? AssociationNamesOrWhereClause
    : VariadicRecurse<
        DB,
        SyncedAssociations,
        ConcreteTableName,
        ConcreteArgs,
        RecursionType,
        UsedNamespaces,
        Depth,
        ConcreteAssociationName
      >

type RecursionTypes = 'joins' | 'pluckThrough' | 'pluckEachThrough'

type VariadicRecurse<
  DB,
  SyncedAssociations extends object,
  ConcreteTableName extends keyof SyncedAssociations & string,
  ConcreteArgs extends readonly unknown[],
  RecursionType extends RecursionTypes,
  UsedNamespaces,
  Depth extends number,
  //
  ConcreteAssociationName,
  //
  ConcreteNthArg extends
    | (keyof SyncedAssociations[ConcreteTableName] & string)
    | object = ConcreteArgs[0] extends keyof SyncedAssociations[ConcreteTableName] & string
    ? ConcreteArgs[0] & keyof SyncedAssociations[ConcreteTableName] & string
    : ConcreteArgs[0] extends object
      ? object
      : never,
  NextUsedNamespaces = ConcreteArgs[0] extends keyof SyncedAssociations[ConcreteTableName] & string
    ? UsedNamespaces | ConcreteNthArg
    : UsedNamespaces,
  //
  NextTableName extends keyof SyncedAssociations &
    string = ConcreteNthArg extends keyof SyncedAssociations[ConcreteTableName] & string
    ? SyncedAssociations[ConcreteTableName][ConcreteNthArg] extends any[]
      ? SyncedAssociations[ConcreteTableName][ConcreteNthArg][0] & keyof SyncedAssociations & string
      : never
    : ConcreteTableName,
  NextAssociationName = ConcreteNthArg extends keyof SyncedAssociations[ConcreteTableName] & string
    ? ConcreteArgs[0] & keyof SyncedAssociations[ConcreteTableName] & string
    : ConcreteAssociationName,
  //
  AllowedNextArgValues = RecursionType extends 'joins'
    ? AllowedNextArgValuesForJoins<DB, SyncedAssociations, NextTableName, NextUsedNamespaces>
    : RecursionType extends 'pluckThrough'
      ?
          | AllowedNextArgValuesForJoins<DB, SyncedAssociations, NextTableName, NextUsedNamespaces>
          | ExtraAllowedNextArgValuesForPluckThrough<
              DB,
              SyncedAssociations,
              NextTableName,
              NextAssociationName
            >
      : RecursionType extends 'pluckEachThrough'
        ?
            | AllowedNextArgValuesForJoins<DB, SyncedAssociations, NextTableName, NextUsedNamespaces>
            | ExtraAllowedNextArgValuesForPluckThrough<
                DB,
                SyncedAssociations,
                NextTableName,
                NextAssociationName
              >
            | ((...args: any[]) => Promise<void> | void)
            | FindEachOpts
        : never,
> = Depth extends MAX_VARIADIC_DEPTH
  ? never
  : VariadicCheckThenRecurse<
      DB,
      SyncedAssociations,
      NextTableName,
      Tail<ConcreteArgs>,
      RecursionType,
      NextUsedNamespaces,
      Inc<Depth>,
      NextAssociationName,
      AllowedNextArgValues
    >

type AllowedNextArgValuesForJoins<
  DB,
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations,
  UsedNamespaces,
> =
  | Exclude<keyof SyncedAssociations[TableName] & string, UsedNamespaces>
  | WhereStatement<
      DB,
      SyncedAssociations,
      TableName & AssociationTableNames<DB, SyncedAssociations> & keyof DB
    >

type ExtraAllowedNextArgValuesForPluckThrough<
  DB,
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations,
  AssociationName,
> =
  | AssociationNameToDotReference<
      DB,
      SyncedAssociations,
      AssociationName,
      TableName & AssociationTableNames<DB, SyncedAssociations> & keyof SyncedAssociations & string
    >
  | AssociationNameToDotReference<
      DB,
      SyncedAssociations,
      AssociationName,
      TableName & AssociationTableNames<DB, SyncedAssociations> & keyof SyncedAssociations & string
    >[]
