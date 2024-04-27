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

export type DreamColumnNames<
  DreamInstance extends Dream,
  DB = DreamInstance['DB'],
  TableName extends keyof DB = DreamInstance['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
> = keyof Table & string

export type DreamParamSafeColumnNames<
  DreamInstance extends Dream,
  BelongsToForeignKeys = DreamBelongsToForeignKeys<DreamInstance>,
> = Exclude<
  DreamColumnNames<DreamInstance>,
  | BelongsToForeignKeys
  | DreamVirtualColumns<DreamInstance>
  | DreamInstance['primaryKey']
  | DreamInstance['createdAtField']
  | DreamInstance['updatedAtField']
  | DreamInstance['deletedAtField']
>

export type DreamBelongsToForeignKeys<
  DreamInstance extends Dream,
  Schema = DreamInstance['dreamconf']['schema'],
  TableSchema = Schema[DreamInstance['table'] & keyof Schema],
  AssociationSchema = TableSchema['associations' & keyof TableSchema],
  BelongsToAssociationSchema = AssociationSchema[keyof DreamBelongsToAssociationMetadata<DreamInstance> &
    keyof AssociationSchema],
  BelongsToForeignKeys = Exclude<
    BelongsToAssociationSchema['foreignKey' & keyof BelongsToAssociationSchema],
    null
  >,
> = BelongsToForeignKeys

export type DreamClassColumnNames<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB = DreamInstance['DB'],
  TableName extends keyof DB = DreamInstance['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
> = keyof Table & string

export type TableColumnNames<
  DB,
  TableName extends keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
> = keyof Table & string

export type DreamColumn<
  DreamInstance extends Dream,
  Column extends keyof Attrs,
  Attrs = DreamAttributes<DreamInstance>,
> = Attrs[Column & keyof Attrs]

export type DreamClassColumn<
  DreamClass extends typeof Dream,
  Column extends keyof DreamAttributes<DreamInstance>,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
> = DreamColumn<DreamInstance, Column>

export type DreamAssociationMetadata<
  DreamInstance extends Dream,
  Schema = DreamInstance['dreamconf']['schema'],
  AssociationMetadata = Schema[DreamInstance['table'] & keyof Schema]['associations' &
    keyof Schema[DreamInstance['table'] & keyof Schema]],
> = AssociationMetadata

type VirtualColumnsForTable<
  Schema,
  TableName extends keyof Schema,
  TableSchema = Schema[TableName],
> = TableSchema['virtualColumns' & keyof TableSchema]

export type DreamVirtualColumns<
  DreamInstance extends Dream,
  Schema = DreamInstance['dreamconf']['schema'],
> = VirtualColumnsForTable<Schema, DreamInstance['table'] & keyof Schema>

export type DreamBelongsToAssociationMetadata<
  DreamInstance extends Dream,
  SchemaAssociations = DreamAssociationMetadata<DreamInstance>,
> = {
  [K in keyof SchemaAssociations]: SchemaAssociations[K]['type' &
    keyof SchemaAssociations[K]] extends 'BelongsTo'
    ? SchemaAssociations[K]['type' & keyof SchemaAssociations[K]]
    : never
}

export type DreamAttributes<
  DreamInstance extends Dream,
  Schema = DreamInstance['dreamconf']['schema'],
  SchemaColumns = Schema[DreamInstance['table'] & keyof Schema]['columns' &
    keyof Schema[DreamInstance['table'] & keyof Schema]],
> = {
  -readonly [K in keyof SchemaColumns]: SchemaColumns[K]['coercedType' & keyof SchemaColumns[K]]
}

export type DreamParamSafeAttributes<DreamInstance extends Dream> = {
  [K in keyof DreamAttributes<DreamInstance> &
    DreamParamSafeColumnNames<DreamInstance>]: DreamAttributes<DreamInstance>[K]
}

export type DreamTableSchema<DreamInstance extends Dream> = Updateable<
  DreamInstance['DB'][DreamInstance['table']]
>

export type UpdateablePropertiesForClass<
  DreamClass extends typeof Dream,
  TableName extends AssociationTableNames<
    InstanceType<DreamClass>['DB'],
    InstanceType<DreamClass>['dreamconf']['schema']
  > &
    InstanceType<DreamClass>['table'] = InstanceType<DreamClass>['table'],
  VirtualColumns = DreamVirtualColumns<InstanceType<DreamClass>>,
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
  Schema = DreamInstance['dreamconf']['schema'],
  AssociationTableName extends AssociationTableNames<
    DreamInstance['DB'],
    DreamInstance['dreamconf']['schema']
  > &
    keyof DreamInstance['DB'] = AssociationClass['table'],
  VirtualColumns = VirtualColumnsForTable<Schema, AssociationTableName>,
> = Partial<
  Updateable<DreamInstance['DB'][AssociationTableName]> &
    (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object) &
    (AssociatedModelParam<AssociationClass> extends never ? object : AssociatedModelParam<AssociationClass>)
>

export type AttributeKeys<
  I extends Dream,
  TableName extends AssociationTableNames<I['DB'], I['dreamconf']['schema']> & I['table'] = I['table'],
  VirtualColumns = DreamVirtualColumns<I>,
> = keyof (Updateable<I['DB'][TableName]> &
  (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object))

export type UpdateableProperties<
  I extends Dream,
  TableName extends AssociationTableNames<I['DB'], I['dreamconf']['schema']> & I['table'] = I['table'],
  VirtualColumns = DreamVirtualColumns<I>,
> = Partial<
  Updateable<I['DB'][TableName]> &
    (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object) &
    (AssociatedModelParam<I> extends never ? object : AssociatedModelParam<I>)
>

export type DreamConstructorType<T extends Dream> = (new (...arguments_: any[]) => T) & typeof Dream

// preload
export type NextPreloadArgumentType<
  Schema,
  PreviousTableNames,
  PreviousSchemaAssociations = PreviousTableNames extends undefined
    ? undefined
    : Schema[PreviousTableNames & keyof Schema]['associations' &
        keyof Schema[PreviousTableNames & keyof Schema]],
> = PreviousTableNames extends undefined
  ? undefined
  : (keyof PreviousSchemaAssociations & string) | (keyof PreviousSchemaAssociations & string)[]

export type PreloadArgumentTypeAssociatedTableNames<
  Schema,
  PreviousTableNames,
  ArgumentType,
  PreviousSchemaAssociations = PreviousTableNames extends undefined
    ? undefined
    : Schema[PreviousTableNames & keyof Schema],
> = ArgumentType extends string[]
  ? undefined
  : (PreviousSchemaAssociations[ArgumentType & (keyof PreviousSchemaAssociations & string)] &
      string[])[number]
// end:preload

export type AssociationNameToDotReference<
  DB,
  Schema,
  AssociationName,
  TableNames extends keyof Schema & string,
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

export type RelaxedJoinsWhereStatement<DB, Schema, Depth extends number = 0> = Depth extends 7
  ? object
  : {
      [key: string]: RelaxedPreloadStatement<Inc<Depth>> | object | WhereStatement<DB, Schema, any>
    }

export type TableOrAssociationName<Schema> = (keyof Schema & string) | (keyof Schema[keyof Schema] & string)

export type SqlCommandType = 'select' | 'update' | 'delete' | 'insert'

export interface SimilarityStatement {
  tableName: string
  tableAlias: string
  columnName: string
  opsStatement: OpsStatement<any, any>
}

type VALID = 'valid'
type INVALID = 'invalid'

///////////////////////////////
// VARIADIC LOAD
///////////////////////////////
type VariadicLoadArgsCheckThenRecurse<
  Schema,
  ConcreteTableName extends keyof Schema & string,
  ConcreteArgs extends readonly unknown[],
  UsedNamespaces,
  Depth extends number,
  AssociationNamesOrWhereClause,
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  NthArgument extends VALID | INVALID = ConcreteArgs['length'] extends 0
    ? VALID
    : ConcreteArgs[0] extends keyof SchemaAssociations & string
      ? VALID
      : INVALID,
> = NthArgument extends INVALID
  ? `invalid where clause in argument ${Inc<Depth>}`
  : ConcreteArgs['length'] extends 0
    ? AssociationNamesOrWhereClause
    : VariadicLoadArgsRecurse<Schema, ConcreteTableName, ConcreteArgs, UsedNamespaces, Depth>

type VariadicLoadArgsRecurse<
  Schema,
  ConcreteTableName extends keyof Schema & string,
  ConcreteArgs extends readonly unknown[],
  UsedNamespaces,
  Depth extends number,
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  ConcreteNthArg extends keyof SchemaAssociations &
    string = ConcreteArgs[0] extends keyof SchemaAssociations & string
    ? ConcreteArgs[0] & keyof SchemaAssociations & string
    : never,
  NextUsedNamespaces = ConcreteArgs[0] extends keyof SchemaAssociations & string
    ? UsedNamespaces | ConcreteNthArg
    : UsedNamespaces,
  //
  NextTableName extends keyof Schema & string = ConcreteNthArg extends keyof SchemaAssociations & string
    ? (SchemaAssociations[ConcreteNthArg]['tables' & keyof SchemaAssociations[ConcreteNthArg]] &
        (keyof Schema & string)[])[0]
    : ConcreteTableName,
  AllowedNextArgValues = Exclude<
    keyof Schema[NextTableName]['associations' & keyof Schema[NextTableName]] & string,
    NextUsedNamespaces
  >,
  //
> = Depth extends MAX_VARIADIC_DEPTH
  ? never
  : VariadicLoadArgsCheckThenRecurse<
      Schema,
      NextTableName,
      Tail<ConcreteArgs>,
      NextUsedNamespaces,
      Inc<Depth>,
      AllowedNextArgValues | AllowedNextArgValues[]
    >

export type VariadicLoadArgs<
  Schema,
  ConcreteTableName extends keyof Schema & string,
  ConcreteArgs extends readonly unknown[],
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  AllowedNextArgValues = keyof SchemaAssociations & string,
> = VariadicLoadArgsCheckThenRecurse<
  Schema,
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
  Schema,
  ConcreteTableName extends keyof Schema & string,
  ConcreteArgs extends readonly unknown[],
  //
  AllowedNextArgValues = keyof Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]] &
    string,
> = VariadicCheckThenRecurse<
  DB,
  Schema,
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
  Schema,
  ConcreteTableName extends keyof Schema & string,
  ConcreteArgs extends readonly unknown[],
  AllowedNextArgValues = keyof Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]] &
    string,
> = VariadicCheckThenRecurse<
  DB,
  Schema,
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
  Schema,
  ConcreteTableName extends keyof Schema & string,
  ConcreteArgs extends readonly unknown[],
  AllowedNextArgValues = keyof Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]] &
    string,
> = VariadicCheckThenRecurse<
  DB,
  Schema,
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
  Schema,
  ConcreteTableName extends keyof Schema & string,
  ConcreteArgs extends readonly unknown[],
  RecursionType extends RecursionTypes,
  UsedNamespaces,
  Depth extends number,
  //
  ConcreteAssociationName,
  //
  AssociationNamesOrWhereClause,
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  NthArgument extends VALID | INVALID = ConcreteArgs['length'] extends 0
    ? VALID
    : ConcreteArgs[0] extends keyof SchemaAssociations & string
      ? VALID
      : ConcreteArgs[0] extends WhereStatement<
            DB,
            Schema,
            ConcreteTableName & AssociationTableNames<DB, Schema> & keyof DB
          >
        ? VALID
        : RecursionType extends 'joins'
          ? INVALID
          : ConcreteArgs[0] extends AssociationNameToDotReference<
                DB,
                Schema,
                ConcreteAssociationName,
                ConcreteTableName & AssociationTableNames<DB, Schema> & keyof Schema & string
              >
            ? VALID
            : ConcreteArgs[0] extends readonly AssociationNameToDotReference<
                  DB,
                  Schema,
                  ConcreteAssociationName,
                  ConcreteTableName & AssociationTableNames<DB, Schema> & keyof Schema & string
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
        Schema,
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
  Schema,
  ConcreteTableName extends keyof Schema & string,
  ConcreteArgs extends readonly unknown[],
  RecursionType extends RecursionTypes,
  UsedNamespaces,
  Depth extends number,
  //
  ConcreteAssociationName,
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  ConcreteNthArg extends
    | (keyof SchemaAssociations & string)
    | object = ConcreteArgs[0] extends keyof SchemaAssociations & string
    ? ConcreteArgs[0] & keyof SchemaAssociations & string
    : ConcreteArgs[0] extends object
      ? object
      : never,
  NextUsedNamespaces = ConcreteArgs[0] extends keyof SchemaAssociations & string
    ? UsedNamespaces | ConcreteNthArg
    : UsedNamespaces,
  //
  NextTableName extends keyof Schema & string = ConcreteNthArg extends keyof SchemaAssociations & string
    ? (SchemaAssociations[ConcreteNthArg & keyof SchemaAssociations]['tables' &
        keyof SchemaAssociations[ConcreteNthArg & keyof SchemaAssociations]] &
        any[])[0]
    : ConcreteTableName,
  NextAssociationName = ConcreteNthArg extends keyof SchemaAssociations & string
    ? ConcreteArgs[0] & keyof SchemaAssociations & string
    : ConcreteAssociationName,
  //
  AllowedNextArgValues = RecursionType extends 'joins'
    ? AllowedNextArgValuesForJoins<DB, Schema, NextTableName, NextUsedNamespaces>
    : RecursionType extends 'pluckThrough'
      ?
          | AllowedNextArgValuesForJoins<DB, Schema, NextTableName, NextUsedNamespaces>
          | ExtraAllowedNextArgValuesForPluckThrough<DB, Schema, NextTableName, NextAssociationName>
      : RecursionType extends 'pluckEachThrough'
        ?
            | AllowedNextArgValuesForJoins<DB, Schema, NextTableName, NextUsedNamespaces>
            | ExtraAllowedNextArgValuesForPluckThrough<DB, Schema, NextTableName, NextAssociationName>
            | ((...args: any[]) => Promise<void> | void)
            | FindEachOpts
        : never,
> = Depth extends MAX_VARIADIC_DEPTH
  ? never
  : VariadicCheckThenRecurse<
      DB,
      Schema,
      NextTableName,
      Tail<ConcreteArgs>,
      RecursionType,
      NextUsedNamespaces,
      Inc<Depth>,
      NextAssociationName,
      AllowedNextArgValues
    >

type AllowedNextArgValuesForJoins<DB, Schema, TableName extends keyof Schema, UsedNamespaces> =
  | Exclude<keyof Schema[TableName]['associations' & keyof Schema[TableName]] & string, UsedNamespaces>
  | WhereStatement<DB, Schema, TableName & AssociationTableNames<DB, Schema> & keyof DB>

type ExtraAllowedNextArgValuesForPluckThrough<DB, Schema, TableName extends keyof Schema, AssociationName> =
  | AssociationNameToDotReference<
      DB,
      Schema,
      AssociationName,
      TableName & AssociationTableNames<DB, Schema> & keyof Schema & string
    >
  | AssociationNameToDotReference<
      DB,
      Schema,
      AssociationName,
      TableName & AssociationTableNames<DB, Schema> & keyof Schema & string
    >[]
