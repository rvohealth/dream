import {
  ColumnType,
  ComparisonOperatorExpression as KyselyComparisonOperatorExpression,
  Updateable,
} from 'kysely'
import { DateTime } from 'luxon'
import { AssociationTableNames } from '../db/reflections'
import { STI_SCOPE_NAME } from '../decorators/STI'
import {
  AssociatedModelParam,
  WhereStatement,
  WhereStatementForAssociation,
} from '../decorators/associations/shared'
import Dream from '../dream'
import CalendarDate from '../helpers/CalendarDate'
import { FilterInterface, Inc, ReadonlyTail, RejectInterface } from '../helpers/typeutils'
import OpsStatement from '../ops/ops-statement'
import DreamSerializer from '../serializer'
import { FindEachOpts } from './query'

export const primaryKeyTypes = ['bigserial', 'bigint', 'uuid', 'integer'] as const
export type PrimaryKeyType = (typeof primaryKeyTypes)[number]

export type IdType = string | number | bigint
export type Timestamp = ColumnType<DateTime | CalendarDate>

type MAX_VARIADIC_DEPTH = 25

class Required {
  constructor() {}
}

class Passthrough {
  constructor() {}
}

export const DreamConst = {
  passthrough: Passthrough,
  required: Required,
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
  Schema = DreamInstance['schema'],
  TableSchema = Schema[DreamInstance['table'] & keyof Schema],
> = Exclude<
  DreamColumnNames<DreamInstance>,
  | BelongsToForeignKeys
  | DreamVirtualColumns<DreamInstance>
  | TableSchema['primaryKey' & keyof TableSchema]
  | TableSchema['createdAtField' & keyof TableSchema]
  | TableSchema['updatedAtField' & keyof TableSchema]
  | TableSchema['deletedAtField' & keyof TableSchema]
>

export type DreamBelongsToForeignKeys<
  DreamInstance extends Dream,
  Schema = DreamInstance['schema'],
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

export type DreamAssociationType<
  DreamInstance extends Dream,
  // Schema extends I['schema'],
  AssociationName extends keyof DreamInstance,
  PossibleArrayAssociationType = DreamInstance[AssociationName],
  AssociationType extends Dream = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType extends Dream
      ? ElementType
      : never
    : PossibleArrayAssociationType extends Dream
      ? PossibleArrayAssociationType
      : never,
> = AssociationType

export type DreamAssociationMetadata<
  DreamInstance extends Dream,
  Schema = DreamInstance['schema'],
  AssociationMetadata = Schema[DreamInstance['table'] & keyof Schema]['associations' &
    keyof Schema[DreamInstance['table'] & keyof Schema]],
> = AssociationMetadata

export type DreamAssociationNamesWithRequiredWhereClauses<
  DreamInstance extends Dream,
  SchemaAssociations = DreamAssociationMetadata<DreamInstance>,
  SchemaTypeInterface = {
    [K in keyof SchemaAssociations]: SchemaAssociations[K]['requiredWhereClauses' &
      keyof SchemaAssociations[K]]
  },
  RequiredWhereClauses = keyof RejectInterface<SchemaTypeInterface, null> & string,
> = RequiredWhereClauses

export type DreamAssociationNamesWithoutRequiredWhereClauses<
  DreamInstance extends Dream,
  SchemaAssociations = DreamAssociationMetadata<DreamInstance>,
  SchemaTypeInterface = {
    [K in keyof SchemaAssociations]: SchemaAssociations[K]['requiredWhereClauses' &
      keyof SchemaAssociations[K]]
  },
  RequiredWhereClauses = keyof FilterInterface<SchemaTypeInterface, null> & string,
> = RequiredWhereClauses

type VirtualColumnsForTable<
  Schema,
  TableName extends keyof Schema,
  TableSchema = Schema[TableName],
> = TableSchema['virtualColumns' & keyof TableSchema]

export type DreamVirtualColumns<
  DreamInstance extends Dream,
  Schema = DreamInstance['schema'],
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
  Schema = DreamInstance['schema'],
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

export type TableColumnType<
  Schema,
  TableName,
  Column,
  TableSchema extends Schema[TableName & keyof Schema] = Schema[TableName & keyof Schema],
  TableColumns extends TableSchema['columns' & keyof TableSchema] = TableSchema['columns' &
    keyof TableSchema],
  TableColumnMetadata extends TableColumns[Column & keyof TableColumns] = TableColumns[Column &
    keyof TableColumns],
  ColumnType extends TableColumnMetadata['coercedType' &
    keyof TableColumnMetadata] = TableColumnMetadata['coercedType' & keyof TableColumnMetadata],
> = ColumnType

///////////////////////////
// Association type helpers
///////////////////////////
type AssociationMetadataForTable<Schema, TableName extends keyof Schema> = Schema[TableName]['associations' &
  keyof Schema[TableName]]

type AssociationNamesForTable<Schema, TableName extends keyof Schema> = keyof AssociationMetadataForTable<
  Schema,
  TableName
>

type MetadataForAssociation<
  Schema,
  TableName extends keyof Schema,
  AssociationName,
  AssociationMetadata = AssociationMetadataForTable<Schema, TableName>,
> = AssociationMetadata[AssociationName & keyof AssociationMetadata]

export type AssociationTableName<
  Schema,
  TableName extends keyof Schema,
  AssociationName,
  AssociationData = MetadataForAssociation<Schema, TableName, AssociationName>,
> = (AssociationData['tables' & keyof AssociationData] & any[])[0] & keyof Schema

type AllowedNextArgValuesForLoad<
  DB,
  Schema,
  TableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
> =
  | AssociationNamesForTable<Schema, TableName>
  | AssociationNamesForTable<Schema, TableName>[]
  | WhereStatement<DB, Schema, TableName>
////////////////////////////////
// end: Association type helpers
////////////////////////////////

export type UpdateablePropertiesForClass<
  DreamClass extends typeof Dream,
  TableName extends AssociationTableNames<
    InstanceType<DreamClass>['DB'],
    InstanceType<DreamClass>['schema']
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
  Schema = DreamInstance['schema'],
  AssociationTableName extends AssociationTableNames<DreamInstance['DB'], DreamInstance['schema']> &
    keyof DreamInstance['DB'] = AssociationClass['table'],
  VirtualColumns = VirtualColumnsForTable<Schema, AssociationTableName>,
> = Partial<
  Updateable<DreamInstance['DB'][AssociationTableName]> &
    (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object) &
    (AssociatedModelParam<AssociationClass> extends never ? object : AssociatedModelParam<AssociationClass>)
>

export type AttributeKeys<
  I extends Dream,
  TableName extends AssociationTableNames<I['DB'], I['schema']> & I['table'] = I['table'],
  VirtualColumns = DreamVirtualColumns<I>,
> = keyof (Updateable<I['DB'][TableName]> &
  (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object))

export type UpdateableProperties<
  I extends Dream,
  TableName extends AssociationTableNames<I['DB'], I['schema']> & I['table'] = I['table'],
  VirtualColumns = DreamVirtualColumns<I>,
> = Partial<
  Updateable<I['DB'][TableName]> &
    (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object) &
    (AssociatedModelParam<I> extends never ? object : AssociatedModelParam<I>)
>

export type DreamConstructorType<T extends Dream> = (new (...arguments_: any[]) => T) & typeof Dream

export type DreamsOrSerializersOrViewModels = DreamOrSerializerOrViewModel | DreamOrSerializerOrViewModel[]

export type DreamOrSerializerOrViewModel =
  | typeof Dream
  | (typeof Dream)[]
  | typeof DreamSerializer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | (abstract new (...args: any) => { serializers: Record<string, typeof DreamSerializer> })

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
  Schema,
  TableNames extends keyof Schema,
  AssociationName,
> = `${AssociationName & string}.${keyof Schema[TableNames]['columns' & keyof Schema[TableNames]] & string}`

export type RelaxedPreloadStatement<Depth extends number = 0> = RelaxedJoinsStatement<Depth>

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
      [key: string]: RelaxedJoinsWhereStatement<DB, Schema, Inc<Depth>> | FakeWhereClauseValue | object
    }

// Just need something that is not an object, but that could be an array and also null
type FakeWhereClauseValue = string | string[] | number | number[] | null

export type TableOrAssociationName<Schema> = (keyof Schema & string) | (keyof Schema[keyof Schema] & string)

export type SqlCommandType = 'select' | 'update' | 'delete' | 'insert'

export interface SimilarityStatement {
  tableName: string
  tableAlias: string
  columnName: string
  opsStatement: OpsStatement<any, any>
}

export type PassthroughColumnNames<
  DreamConf,
  GlobalSchema = DreamConf['globalSchema' & keyof DreamConf],
  PassthroughColumns = GlobalSchema['passthroughColumns' & keyof GlobalSchema],
> = PassthroughColumns[number & keyof PassthroughColumns]

// it is not valid to remove the STI scope

export type DefaultScopeName<
  DreamInstance extends Dream,
  Schema = DreamInstance['schema'],
  SchemaTable = Schema[DreamInstance['table'] & keyof Schema],
  SchemaDefaultScopes extends string[] = SchemaTable['scopes' & keyof SchemaTable]['default' &
    keyof SchemaTable['scopes' & keyof SchemaTable]] &
    string[],
> =
  // it is not valid to remove the STI scope
  Exclude<SchemaDefaultScopes[number], typeof STI_SCOPE_NAME>

export type AllDefaultScopeNames<
  DreamConf,
  GlobalSchema = DreamConf['globalSchema' & keyof DreamConf],
  AllNames = GlobalSchema['allDefaultScopeNames' & keyof GlobalSchema],
> =
  // it is not valid to remove the STI scope
  Exclude<AllNames[number & keyof AllNames], typeof STI_SCOPE_NAME>

export type NamedScopeName<
  DreamInstance extends Dream,
  Schema = DreamInstance['schema'],
  SchemaTable = Schema[DreamInstance['table'] & keyof Schema],
  SchemaNamedScopes extends string[] = SchemaTable['scopes' & keyof SchemaTable]['named' &
    keyof SchemaTable['scopes' & keyof SchemaTable]] &
    string[],
> = SchemaNamedScopes[number]

export type DefaultOrNamedScopeName<DreamInstance extends Dream> =
  | DefaultScopeName<DreamInstance>
  | NamedScopeName<DreamInstance>

type NA = 'na'
type VALID = 'valid'
type INVALID = 'invalid'

type IS_ASSOCIATION_NAME = 'association_name'
type IS_NOT_ASSOCIATION_NAME = 'not_association_name'

type RecursionTypes =
  | 'load'
  | 'joins'
  | 'pluckThrough'
  | 'pluckEachThrough'
  | 'minMaxThrough'
  | 'countThrough'

///////////////////////////////
// VARIADIC LOAD
///////////////////////////////
export type VariadicLoadArgs<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
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
  never,
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
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
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
  never,
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
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
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
  AssociationNameToDotReference<Schema, ConcreteTableName, ConcreteTableName>,
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
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
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
  AssociationNameToDotReference<Schema, ConcreteTableName, ConcreteTableName>,
  0,
  null,
  never,
  AllowedNextArgValues
>
///////////////////////////////
// end: VARIADIC PLUCK EACH THROUGH
///////////////////////////////

///////////////////////////////
// VARIADIC MIN/MAX THROUGH
///////////////////////////////
export type VariadicMinMaxThroughArgs<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  ConcreteArgs extends readonly unknown[],
  AllowedNextArgValues = keyof Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]] &
    string,
> = VariadicCheckThenRecurse<
  DB,
  Schema,
  ConcreteTableName,
  ConcreteArgs,
  'minMaxThrough',
  ConcreteTableName,
  never,
  0,
  null,
  never,
  AllowedNextArgValues
>
///////////////////////////////
// end: VARIADIC MIN/MAX THROUGH
///////////////////////////////

///////////////////////////////
// VARIADIC COUNT THROUGH
///////////////////////////////
export type VariadicCountThroughArgs<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  ConcreteArgs extends readonly unknown[],
  AllowedNextArgValues = keyof Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]] &
    string,
> = VariadicCheckThenRecurse<
  DB,
  Schema,
  ConcreteTableName,
  ConcreteArgs,
  'countThrough',
  ConcreteTableName,
  never,
  0,
  null,
  never,
  AllowedNextArgValues
>
///////////////////////////////
// end: VARIADIC COUNT THROUGH
///////////////////////////////

/**
 * @internal
 *
 * Given a list of arguments provided to
 * a variadic function (like minThrough,
 * maxThrough, etc...), find the final
 * association's dream class and return it
 */
export type FinalVariadicTableName<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  ConcreteArgs extends readonly unknown[],
> = VariadicDreamClassRecurse<DB, Schema, ConcreteTableName, ConcreteArgs, 0, null, never>

type VariadicDreamClassRecurse<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  ConcreteArgs extends readonly unknown[],
  Depth extends number,
  //
  PreviousConcreteTableName,
  ConcreteAssociationName,
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  ConcreteNthArg extends (keyof SchemaAssociations & string) | null = ConcreteArgs[0] extends null
    ? never
    : ConcreteArgs[0] extends keyof SchemaAssociations & string
      ? ConcreteArgs[0] & keyof SchemaAssociations & string
      : null,
  //
  CurrentArgumentType extends IS_ASSOCIATION_NAME | IS_NOT_ASSOCIATION_NAME = ConcreteNthArg extends null
    ? IS_NOT_ASSOCIATION_NAME
    : ConcreteNthArg extends keyof SchemaAssociations & string
      ? IS_ASSOCIATION_NAME
      : IS_NOT_ASSOCIATION_NAME,
  //
  NextPreviousConcreteTableName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteTableName
    : PreviousConcreteTableName,
  //
  NextTableName extends keyof Schema &
    AssociationTableNames<DB, Schema> &
    keyof DB = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? (SchemaAssociations[ConcreteNthArg & keyof SchemaAssociations]['tables' &
        keyof SchemaAssociations[ConcreteNthArg & keyof SchemaAssociations]] &
        any[])[0] &
        AssociationTableNames<DB, Schema> &
        keyof DB
    : ConcreteTableName & AssociationTableNames<DB, Schema> & keyof DB,
  //
  NextAssociationName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteNthArg
    : ConcreteAssociationName,
  //
> = ConcreteArgs['length'] extends 0
  ? NextTableName
  : Depth extends MAX_VARIADIC_DEPTH
    ? never
    : VariadicDreamClassRecurse<
        DB,
        Schema,
        NextTableName,
        ReadonlyTail<ConcreteArgs>,
        Inc<Depth>,
        NextPreviousConcreteTableName,
        NextAssociationName
      >

export type RequiredWhereClauseKeys<
  Schema,
  TableName,
  AssociationName,
  Associations = TableName extends null
    ? null
    : TableName extends keyof Schema & string
      ? Schema[TableName]['associations' & keyof Schema[TableName]]
      : null,
  Association = Associations extends null
    ? null
    : AssociationName extends keyof Associations
      ? Associations[AssociationName]
      : null,
  RequiredWhereClauses = Association extends null
    ? null
    : Association['requiredWhereClauses' & keyof Association] & (string[] | null),
> = RequiredWhereClauses

type VariadicCheckThenRecurse<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  ConcreteArgs extends readonly unknown[],
  RecursionType extends RecursionTypes,
  UsedNamespaces,
  NamespacedColumns,
  Depth extends number,
  //
  PreviousConcreteTableName,
  ConcreteAssociationName,
  //
  AssociationNamesOrWhereClause,
  //
  RequiredWhereClauses = RequiredWhereClauseKeys<Schema, PreviousConcreteTableName, ConcreteAssociationName>,
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
      : ConcreteArgs[0] extends keyof SchemaAssociations & string
        ? VALID
        : ConcreteArgs[0] extends WhereStatement<DB, Schema, ConcreteTableName>
          ? VALID
          : RecursionType extends 'load' | 'joins' | 'countThrough'
            ? INVALID
            : ConcreteArgs[0] extends AssociationNameToDotReference<
                  Schema,
                  ConcreteTableName,
                  ConcreteAssociationName
                >
              ? VALID
              : ConcreteArgs[0] extends readonly AssociationNameToDotReference<
                    Schema,
                    ConcreteTableName,
                    ConcreteAssociationName
                  >[]
                ? VALID
                : RecursionType extends 'pluckThrough' | 'minMaxThrough'
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
        NamespacedColumns,
        Depth,
        PreviousConcreteTableName,
        ConcreteAssociationName,
        WhereClauseRequirementsMet
      >

type VariadicRecurse<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  ConcreteArgs extends readonly unknown[],
  RecursionType extends RecursionTypes,
  UsedNamespaces,
  NamespacedColumns,
  Depth extends number,
  //
  PreviousConcreteTableName,
  ConcreteAssociationName,
  WhereClauseRequirementsMet extends VALID | INVALID | NA,
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  ConcreteNthArg extends (keyof SchemaAssociations & string) | null = ConcreteArgs[0] extends null
    ? never
    : ConcreteArgs[0] extends keyof SchemaAssociations & string
      ? ConcreteArgs[0] & keyof SchemaAssociations & string
      : null,
  NextUsedNamespaces = ConcreteArgs[0] extends null
    ? never
    : ConcreteArgs[0] extends keyof SchemaAssociations & string
      ? UsedNamespaces | ConcreteNthArg
      : UsedNamespaces,
  //
  CurrentArgumentType extends IS_ASSOCIATION_NAME | IS_NOT_ASSOCIATION_NAME = ConcreteNthArg extends null
    ? IS_NOT_ASSOCIATION_NAME
    : ConcreteNthArg extends keyof SchemaAssociations & string
      ? IS_ASSOCIATION_NAME
      : IS_NOT_ASSOCIATION_NAME,
  //
  NextPreviousConcreteTableName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteTableName
    : PreviousConcreteTableName,
  //
  NextTableName extends keyof Schema &
    AssociationTableNames<DB, Schema> &
    keyof DB = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? (SchemaAssociations[ConcreteNthArg & keyof SchemaAssociations]['tables' &
        keyof SchemaAssociations[ConcreteNthArg & keyof SchemaAssociations]] &
        any[])[0] &
        AssociationTableNames<DB, Schema> &
        keyof DB
    : ConcreteTableName & AssociationTableNames<DB, Schema> & keyof DB,
  //
  NextAssociationName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteNthArg
    : ConcreteAssociationName,
  //
  NextNamespacedColumns = RecursionType extends 'pluckThrough' | 'pluckEachThrough'
    ? ConcreteArgs[0] extends null
      ? never
      : ConcreteArgs[0] extends keyof SchemaAssociations & string
        ? NamespacedColumns | AssociationNameToDotReference<Schema, NextTableName, NextAssociationName>
        : NamespacedColumns
    : never,
  //
  RequiredWhereClauses = WhereClauseRequirementsMet extends VALID
    ? null
    : RequiredWhereClauseKeys<Schema, ConcreteTableName, NextAssociationName>,
  //
  AllowedNextArgValues = RequiredWhereClauses extends null
    ? RecursionType extends 'load'
      ? AllowedNextArgValuesForLoad<DB, Schema, NextTableName>
      : RecursionType extends 'joins' | 'countThrough'
        ? AllowedNextArgValuesForJoins<DB, Schema, NextTableName, NextUsedNamespaces>
        : RecursionType extends 'minMaxThrough'
          ?
              | AllowedNextArgValuesForJoins<DB, Schema, NextTableName, NextUsedNamespaces>
              | AssociationNameToDotReference<Schema, NextTableName, NextAssociationName>
          : RecursionType extends 'pluckThrough'
            ?
                | AllowedNextArgValuesForJoins<DB, Schema, NextTableName, NextUsedNamespaces>
                | NextNamespacedColumns
                | NextNamespacedColumns[]
            : RecursionType extends 'pluckEachThrough'
              ?
                  | AllowedNextArgValuesForJoins<DB, Schema, NextTableName, NextUsedNamespaces>
                  | ((...args: any[]) => Promise<void> | void)
                  | FindEachOpts
                  | NextNamespacedColumns
                  | NextNamespacedColumns[]
              : never
    : RequiredWhereClauses extends string[]
      ? WhereStatementForAssociation<DB, Schema, ConcreteTableName, NextAssociationName>
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
      NextNamespacedColumns,
      Inc<Depth>,
      NextPreviousConcreteTableName,
      NextAssociationName,
      AllowedNextArgValues
    >

type AllowedNextArgValuesForJoins<
  DB,
  Schema,
  TableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  UsedNamespaces,
> =
  | Exclude<AssociationNamesForTable<Schema, TableName>, UsedNamespaces>
  | WhereStatement<DB, Schema, TableName>
