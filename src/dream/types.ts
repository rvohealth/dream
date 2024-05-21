import { ComparisonOperatorExpression as KyselyComparisonOperatorExpression } from 'kysely'
import { DateTime } from 'luxon'
import { Updateable, ColumnType } from 'kysely'
import { AssociationTableNames } from '../db/reflections'
import Dream from '../dream'
import { FilterInterface, Inc, ReadonlyTail } from '../helpers/typeutils'
import { AssociatedModelParam, WhereStatement } from '../decorators/associations/shared'
import OpsStatement from '../ops/ops-statement'
import { FindEachOpts } from './query'
import CalendarDate from '../helpers/CalendarDate'

export const primaryKeyTypes = ['bigserial', 'bigint', 'uuid', 'integer'] as const
export type PrimaryKeyType = (typeof primaryKeyTypes)[number]

export type IdType = string | number | bigint | undefined
export type Timestamp = ColumnType<DateTime | CalendarDate>

type MAX_VARIADIC_DEPTH = 25

class RequiredWhereClause {
  constructor() {}
}

class Passthrough {
  constructor() {}
}

export const DreamConst = {
  passthrough: Passthrough,
  requiredWhereClause: RequiredWhereClause,
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
  SchemaTypeInterface = {
    [K in keyof SchemaAssociations]: SchemaAssociations[K]['type' & keyof SchemaAssociations[K]]
  },
  BelongsToKeys = keyof FilterInterface<SchemaTypeInterface, 'BelongsTo'> & string,
  TypeRecord = { [K in BelongsToKeys & string]: SchemaAssociations[K & keyof SchemaAssociations] },
> = TypeRecord

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

export type RelaxedPreloadWhereStatement<DB, Schema, Depth extends number = 0> = RelaxedJoinsWhereStatement<
  DB,
  Schema,
  Depth
>

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

type NA = 'na'
type VALID = 'valid'
type INVALID = 'invalid'

type IS_ASSOCIATION_NAME = 'association_name'
type IS_NOT_ASSOCIATION_NAME = 'not_association_name'

type RecursionTypes = 'load' | 'joins' | 'pluckThrough' | 'pluckEachThrough'

///////////////////////////////
// VARIADIC LOAD
///////////////////////////////
export type VariadicLoadArgs<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & string,
  ConcreteArgs extends readonly unknown[],
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  AllowedNextArgValues = keyof SchemaAssociations & string,
> = VariadicCheckThenRecurse<
  DB,
  Schema,
  ConcreteTableName,
  ConcreteArgs,
  'load',
  ConcreteTableName,
  0,
  null,
  never,
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
  ConcreteTableName,
  0,
  null,
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
  ConcreteTableName,
  0,
  null,
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
  ConcreteTableName,
  0,
  null,
  never,
  AllowedNextArgValues
>
///////////////////////////////
// end: VARIADIC PLUCK EACH THROUGH
///////////////////////////////

export type RequiredWhereClausesType<
  Schema,
  TableName,
  AssociationName,
  Associations = TableName extends null
    ? null
    : TableName extends keyof Schema & string
      ? Schema[TableName]['associations' & keyof Schema[TableName]]
      : never,
  Association = Associations extends null
    ? null
    : AssociationName extends keyof Associations
      ? Associations[AssociationName]
      : never,
  RequiredWhereClauses = Association extends null
    ? null
    : Association['requiredWhereClauses' & keyof Association] & (string[] | null),
> = RequiredWhereClauses

type VariadicCheckThenRecurse<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & string,
  ConcreteArgs extends readonly unknown[],
  RecursionType extends RecursionTypes,
  UsedNamespaces,
  Depth extends number,
  //
  PreviousConcreteTableName,
  ConcreteAssociationName,
  //
  AssociationNamesOrWhereClause,
  //
  RequiredWhereClauses = RequiredWhereClausesType<Schema, PreviousConcreteTableName, ConcreteAssociationName>,
  WhereClauseRequirementsMet extends VALID | INVALID | NA = RequiredWhereClauses extends null
    ? NA
    : RequiredWhereClauses extends string[]
      ? ConcreteArgs[0] extends object
        ? keyof ConcreteArgs[0] extends RequiredWhereClauses[number]
          ? VALID
          : INVALID
        : INVALID
      : never,
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  NthArgument extends VALID | INVALID = ConcreteArgs['length'] extends 0
    ? VALID
    : WhereClauseRequirementsMet extends INVALID
      ? INVALID
      : WhereClauseRequirementsMet extends VALID
        ? VALID
        : ConcreteArgs[0] extends keyof SchemaAssociations & string
          ? VALID
          : ConcreteArgs[0] extends WhereStatement<
                DB,
                Schema,
                ConcreteTableName & AssociationTableNames<DB, Schema> & keyof DB
              >
            ? VALID
            : RecursionType extends 'load' | 'joins'
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
        PreviousConcreteTableName,
        ConcreteAssociationName,
        WhereClauseRequirementsMet
      >

type VariadicRecurse<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & string,
  ConcreteArgs extends readonly unknown[],
  RecursionType extends RecursionTypes,
  UsedNamespaces,
  Depth extends number,
  //
  PreviousConcreteTableName,
  ConcreteAssociationName,
  WhereClauseRequirementsMet extends VALID | INVALID | NA,
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

  CurrentArgumentType extends
    | IS_ASSOCIATION_NAME
    | IS_NOT_ASSOCIATION_NAME = ConcreteNthArg extends keyof SchemaAssociations & string
    ? IS_ASSOCIATION_NAME
    : IS_NOT_ASSOCIATION_NAME,
  //
  NextPreviousConcreteTableName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteTableName
    : PreviousConcreteTableName,
  //
  NextTableName extends keyof Schema & string = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? (SchemaAssociations[ConcreteNthArg & keyof SchemaAssociations]['tables' &
        keyof SchemaAssociations[ConcreteNthArg & keyof SchemaAssociations]] &
        any[])[0]
    : ConcreteTableName,
  //
  NextAssociationName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteNthArg
    : ConcreteAssociationName,
  //
  RequiredWhereClauses = WhereClauseRequirementsMet extends VALID | NA
    ? null
    : RequiredWhereClausesType<Schema, ConcreteTableName, NextAssociationName>,
  //
  AllowedNextArgValues = RequiredWhereClauses extends null
    ? RecursionType extends 'load'
      ? AllowedNextArgValuesForLoad<DB, Schema, NextTableName>
      : RecursionType extends 'joins'
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
            : never
    : RequiredWhereClauses extends string[]
      ? Partial<Omit<WhereStatementForVariadic<DB, Schema, NextTableName>, RequiredWhereClauses[number]>> &
          Required<
            Pick<
              WhereStatementForVariadic<DB, Schema, NextTableName>,
              RequiredWhereClauses[number] & keyof WhereStatementForVariadic<DB, Schema, NextTableName>
            >
          >
      : never,
> = Depth extends MAX_VARIADIC_DEPTH
  ? never
  : VariadicCheckThenRecurse<
      DB,
      Schema,
      NextTableName,
      ReadonlyTail<ConcreteArgs>,
      RecursionType,
      NextUsedNamespaces,
      Inc<Depth>,
      NextPreviousConcreteTableName,
      NextAssociationName,
      AllowedNextArgValues
    >

type AssociationNamesForTable<
  Schema,
  TableName extends keyof Schema,
> = keyof Schema[TableName]['associations' & keyof Schema[TableName]] & string

type AllowedNextArgValuesForLoad<DB, Schema, TableName extends keyof Schema> =
  | AssociationNamesForTable<Schema, TableName>
  | AssociationNamesForTable<Schema, TableName>[]
  | WhereStatementForVariadic<DB, Schema, TableName>

type AllowedNextArgValuesForJoins<DB, Schema, TableName extends keyof Schema, UsedNamespaces> =
  | Exclude<AssociationNamesForTable<Schema, TableName>, UsedNamespaces>
  | WhereStatementForVariadic<DB, Schema, TableName>

type WhereStatementForVariadic<DB, Schema, TableName extends keyof Schema> = WhereStatement<
  DB,
  Schema,
  TableName & AssociationTableNames<DB, Schema> & keyof DB
>

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
