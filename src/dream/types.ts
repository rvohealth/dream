import { ComparisonOperatorExpression as KyselyComparisonOperatorExpression } from 'kysely'
import { DateTime } from 'luxon'
import { Updateable, ColumnType } from 'kysely'
import { AssociationTableNames } from '../db/reflections'
import Dream from '../dream'
import { Decrement, Inc } from '../helpers/typeutils'
import { AssociatedModelParam, WhereStatement } from '../decorators/associations/shared'
import OpsStatement from '../ops/ops-statement'
import { Shift } from 'meta-types'
import { SyncedAssociations } from '../../test-app/db/associations'

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
    (VirtualColumns extends any[] ? Record<VirtualColumns[number], any> : object) &
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
    (VirtualColumns extends any[] ? Record<VirtualColumns[number], any> : object) &
    (AssociatedModelParam<AssociationClass> extends never ? object : AssociatedModelParam<AssociationClass>)
>

export type AttributeKeys<
  I extends Dream,
  TableName extends AssociationTableNames<I['DB'], I['syncedAssociations']> & I['table'] = I['table'],
  VirtualColumns = I['dreamconf']['virtualColumns'][TableName],
> = keyof (Updateable<I['DB'][TableName]> &
  (VirtualColumns extends any[] ? Record<VirtualColumns[number], any> : object))

export type UpdateableProperties<
  I extends Dream,
  TableName extends AssociationTableNames<I['DB'], I['syncedAssociations']> & I['table'] = I['table'],
  VirtualColumns = I['dreamconf']['virtualColumns'][TableName],
> = Partial<
  Updateable<I['DB'][TableName]> &
    (VirtualColumns extends any[] ? Record<VirtualColumns[number], any> : object) &
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

// joins
export type NextJoinsWhereArgumentType<
  DB,
  SyncedAssociations,
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
  DB,
  SyncedAssociations,
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
  DB,
  SyncedAssociations,
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
  DB,
  SyncedAssociations,
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

type RecurseVariadicJoinsArgs<
  InputArr extends readonly [keyof SyncedAssociations[TableName] & string, ...any[]],
  OutputArr extends readonly any[],
  DB extends object,
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations & string,
  Index extends number,
  CurrValue = InputArr extends [infer T & keyof SyncedAssociations[TableName] & string, ...any[]] ? T : never,
  AssociationName extends InputArr[0] & keyof SyncedAssociations[TableName] & string = InputArr[0] &
    keyof SyncedAssociations[TableName] &
    string,
  NextTableName extends keyof SyncedAssociations &
    string = SyncedAssociations[TableName][AssociationName] extends any[]
    ? SyncedAssociations[TableName][AssociationName][0] & keyof SyncedAssociations & string
    : never,
> = CurrValue extends never
  ? never
  : Index extends 4
    ? [...OutputArr, ...any[]]
    : InputArr['length'] extends 1
      ? // ? OutputArr
        [...OutputArr, NextJoinsWhereArgumentType<DB, SyncedAssociations, TableName>]
      : // : CurrValue extends InputArr[0] & keyof SyncedAssociations[TableName] & string
        //   ? SyncedAssociations[TableName][CurrValue] extends (keyof SyncedAssociations & string)[]
        NextTableName extends (SyncedAssociations[TableName][CurrValue & InputArr[0]] &
            (keyof SyncedAssociations)[])[0] &
            keyof SyncedAssociations &
            string
        ? RecurseVariadicJoinsArgs<
            Shift<InputArr, 1> & [keyof SyncedAssociations[NextTableName] & string, ...any[]],
            [...OutputArr, CurrValue & NextJoinsWhereArgumentType<DB, SyncedAssociations, NextTableName>],
            DB,
            SyncedAssociations,
            NextTableName,
            Inc<Index>
          >
        : never
// : never
// : never

export type VariadicJoinsArgs<
  DB extends object,
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations & string,
  T extends readonly [keyof SyncedAssociations[TableName] & string, ...any[]],
> = T['length'] extends 1
  ? // ? [keyof SyncedAssociations[TableName] & string]
    ['chalupas']
  : RecurseVariadicJoinsArgs<T, [], DB, SyncedAssociations, TableName, 0>

export type BruteForceVariadicJoinsArgs<
  DB extends object,
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations & string,
  T extends readonly any[],
  FirstValue extends T[0] & keyof SyncedAssociations[TableName] & string = T[0] &
    keyof SyncedAssociations[TableName] &
    string,
  FirstValueTableName extends (SyncedAssociations[TableName][FirstValue &
    keyof SyncedAssociations[TableName]] &
    (keyof SyncedAssociations)[])[number] = (SyncedAssociations[TableName][FirstValue &
    keyof SyncedAssociations[TableName]] &
    (keyof SyncedAssociations)[])[number],
  SecondValue extends T['length'] extends 1
    ? never
    : NextJoinsWhereArgumentType<DB, SyncedAssociations, FirstValueTableName> = T['length'] extends 1
    ? never
    : NextJoinsWhereArgumentType<DB, SyncedAssociations, FirstValueTableName>,
> = T['length'] extends 1 ? [FirstValue] : T['length'] extends 2 ? [FirstValue & T[0], FirstValue] : never

type RecurseVariadicJoinsArgsBak<
  InputArr extends readonly any[],
  OutputArr extends readonly any[],
  DB extends object,
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations & string,
  Index extends number,
  AssociationName extends InputArr[Index] & keyof SyncedAssociations[TableName] & string = InputArr[Index] &
    keyof SyncedAssociations[TableName] &
    string,
  NextTableName extends SyncedAssociations[TableName][AssociationName &
    keyof SyncedAssociations[TableName] &
    string] extends (keyof SyncedAssociations & string)[]
    ? SyncedAssociations[TableName][AssociationName & keyof SyncedAssociations[TableName] & string][0] &
        keyof SyncedAssociations &
        string
    : never = SyncedAssociations[TableName][AssociationName &
    keyof SyncedAssociations[TableName] &
    string] extends (keyof SyncedAssociations & string)[]
    ? SyncedAssociations[TableName][AssociationName & keyof SyncedAssociations[TableName] & string][0] &
        keyof SyncedAssociations &
        string
    : never,
> = Index extends 5
  ? [...OutputArr, ...any[]]
  : Index extends Decrement<InputArr['length']>
    ? [...OutputArr, NextJoinsWhereArgumentType<DB, SyncedAssociations, TableName>]
    : InputArr[Index] extends keyof SyncedAssociations[TableName] & string
      ? SyncedAssociations[TableName][InputArr[Index]] extends (keyof SyncedAssociations & string)[]
        ? NextTableName extends (SyncedAssociations[TableName][InputArr[Index]] &
            (keyof SyncedAssociations)[])[0] &
            keyof SyncedAssociations &
            string
          ? RecurseVariadicJoinsArgsBak<
              InputArr,
              [...OutputArr, InputArr[Index] & NextJoinsWhereArgumentType<DB, SyncedAssociations, TableName>],
              DB,
              SyncedAssociations,
              NextTableName,
              // SyncedAssociations[TableName][ArrType[Index]][0],
              // NextTableName & keyof SyncedAssociations & string,
              // 'pets' & keyof SyncedAssociations,
              // (SyncedAssociations[TableName][ArrType[Index]] & (keyof SyncedAssociations)[])[0] &
              //   keyof SyncedAssociations &
              //   string,
              Inc<Index>
            >
          : never
        : never
      : never

export type VariadicJoinsArgsBak<
  DB extends object,
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations & string,
  T extends readonly any[],
> = RecurseVariadicJoinsArgsBak<T, [], DB, SyncedAssociations, TableName, 0>

export type VariadicJoinsArgs2<
  DB extends object,
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations & string,
  T extends readonly any[],
  // > = RecurseVariadicJoinsArgs2<T, [], DB, SyncedAssociations, TableName>
> = T['length'] extends 0 | 1
  ? [keyof SyncedAssociations[TableName] & string]
  : RecurseVariadicJoinsArgs2<T, [], DB, SyncedAssociations, TableName>

type RecurseVariadicJoinsArgs2<
  InputArr extends readonly any[],
  OutputArr extends readonly any[],
  DB extends object,
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations & string,
  AssociationName extends InputArr[0] & keyof SyncedAssociations[TableName] & string = InputArr[0] &
    keyof SyncedAssociations[TableName] &
    string,
  NextTableName extends keyof SyncedAssociations &
    string = SyncedAssociations[TableName][AssociationName] extends any[]
    ? SyncedAssociations[TableName][AssociationName][0] & keyof SyncedAssociations & string
    : never,
> = InputArr['length'] extends 0
  ? [...OutputArr, keyof SyncedAssociations[TableName]]
  : // : NextTableName extends (SyncedAssociations[TableName][InputArr[0]] & (keyof SyncedAssociations)[])[0] &
    //       keyof SyncedAssociations &
    //       string
    //   ? // ? SyncedAssociations[TableName][ArrType[Index]][0] extends keyof SyncedAssociations & string

    RecurseVariadicJoinsArgs2<
      Shift<InputArr, 1>,
      [...OutputArr, AssociationName],
      DB,
      SyncedAssociations,
      NextTableName
    >
// : never
// : Shift<InputArr, 1> extends [keyof SyncedAssociations[NextTableName] & string, ...any[]]
//   ? RecurseVariadicJoinsArgs2<
//       Shift<InputArr, 1> & [keyof SyncedAssociations[NextTableName] & string, ...any[]],
//       [...OutputArr, TableName],
//       DB,
//       SyncedAssociations,
//       NextTableName
//     >
//   : never

export type VariadicJoinsArgs3<
  DB extends object,
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations & string,
  ConcreteArgs extends readonly any[],
> = ConcreteArgs['length'] extends 0 | 1
  ? [keyof SyncedAssociations[TableName] & string]
  : MapTypes<ConcreteArgs, DB, SyncedAssociations, TableName, [keyof SyncedAssociations[TableName]]>

type MapTypes<
  ConcreteArgs extends readonly any[],
  DB extends object,
  SyncedAssociations extends object,
  ConcreteTableName extends keyof SyncedAssociations & string,
  Accumulator extends any[],
  Depth extends number = 0,
  TypedFirstArg = ConcreteArgs extends [infer T extends keyof SyncedAssociations[ConcreteTableName], ...any[]]
    ? T
    : never,
  ConcreteAssociationName extends ConcreteArgs[0] &
    keyof SyncedAssociations[ConcreteTableName] &
    string = ConcreteArgs[0] & keyof SyncedAssociations[ConcreteTableName] & string,
  NextTableName extends keyof SyncedAssociations &
    string = SyncedAssociations[ConcreteTableName][ConcreteAssociationName] extends any[]
    ? SyncedAssociations[ConcreteTableName][ConcreteAssociationName][0] & keyof SyncedAssociations & string
    : never,
  PossibleNextAssociationNames = keyof SyncedAssociations[NextTableName] & string,
> = ConcreteArgs['length'] extends 1
  ? [...Accumulator, keyof SyncedAssociations[ConcreteTableName]]
  : Depth extends 31
    ? never
    : MapTypes<
        // Tail<ConcreteArgs>,
        Shift<ConcreteArgs, 1>,
        DB,
        SyncedAssociations,
        NextTableName,
        [...Accumulator, PossibleNextAssociationNames],
        Inc<Depth>
      >
