import {
  ColumnType,
  ComparisonOperatorExpression as KyselyComparisonOperatorExpression,
  Updateable,
} from 'kysely'
import { DateTime } from 'luxon'
import { AssociationTableNames } from '../db/reflections'
import { BelongsToStatement } from '../decorators/associations/BelongsTo'
import { HasManyStatement } from '../decorators/associations/HasMany'
import { HasOneStatement } from '../decorators/associations/HasOne'
import {
  AssociatedModelParam,
  WhereStatement,
  WhereStatementForAssociation,
} from '../decorators/associations/shared'
import { STI_SCOPE_NAME } from '../decorators/STI'
import Dream from '../Dream'
import CalendarDate from '../helpers/CalendarDate'
import { FilterInterface, Inc, ReadonlyTail } from '../helpers/typeutils'
import OpsStatement from '../ops/ops-statement'
import DreamSerializer from '../serializer'

export const primaryKeyTypes = ['bigserial', 'bigint', 'uuid', 'integer'] as const
export type PrimaryKeyType = (typeof primaryKeyTypes)[number]

export type IdType = string | number | bigint
export type Timestamp = ColumnType<DateTime | CalendarDate>

type MAX_VARIADIC_DEPTH = 25

class RequiredAttribute {
  constructor() {}
}

class PassthroughAttribute {
  constructor() {}
}

export const DreamConst = {
  passthrough: PassthroughAttribute,
  required: RequiredAttribute,
}

export const TRIGRAM_OPERATORS = ['%', '<%', '<<%'] as const
export type TrigramOperator = (typeof TRIGRAM_OPERATORS)[number]
export type ComparisonOperatorExpression = KyselyComparisonOperatorExpression | TrigramOperator
export type OrderDir = 'asc' | 'desc'

export interface SortableOptions<T extends typeof Dream> {
  scope?:
    | keyof DreamBelongsToAssociationMetadata<InstanceType<T>>
    | DreamColumnNames<InstanceType<T>>
    | (keyof DreamBelongsToAssociationMetadata<InstanceType<T>> | DreamColumnNames<InstanceType<T>>)[]
}

export type PrimaryKeyForFind<
  I extends Dream,
  Schema extends I['schema'] = I['schema'],
  TableName extends keyof Schema = I['table'] & keyof Schema,
> =
  | Schema[TableName]['columns'][I['primaryKey'] & keyof Schema[TableName]['columns']]['coercedType']
  | string
  | null
  | undefined

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
  AssociationName extends DreamAssociationNames<DreamInstance>,
  PossibleArrayAssociationType = DreamInstance[AssociationName & keyof DreamInstance],
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

export type DreamAssociationNamesWithoutRequiredWhereClauses<
  DreamInstance extends Dream,
  SchemaAssociations = DreamAssociationMetadata<DreamInstance>,
  SchemaTypeInterface = {
    [K in keyof SchemaAssociations]: SchemaAssociations[K]['requiredWhereClauses' &
      keyof SchemaAssociations[K]]
  },
  RequiredWhereClauses = keyof FilterInterface<SchemaTypeInterface, null> & string,
> = RequiredWhereClauses

export type DreamAssociationNames<
  DreamInstance extends Dream,
  SchemaAssociations = DreamAssociationMetadata<DreamInstance>,
> = keyof SchemaAssociations

type VirtualColumnsForTable<
  Schema,
  TableName extends keyof Schema,
  TableSchema = Schema[TableName],
> = TableSchema['virtualColumns' & keyof TableSchema]

export type DreamVirtualColumns<
  DreamInstance extends Dream,
  Schema = DreamInstance['schema'],
> = VirtualColumnsForTable<Schema, DreamInstance['table'] & keyof Schema>

type EncryptedColumnsForTable<
  Schema,
  TableName extends keyof Schema,
  TableSchema = Schema[TableName],
> = TableSchema['encryptedColumns' & keyof TableSchema]

export type DreamEncryptedColumns<
  DreamInstance extends Dream,
  Schema = DreamInstance['schema'],
> = EncryptedColumnsForTable<Schema, DreamInstance['table'] & keyof Schema>

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

export type DreamAttributeDbTypes<
  DreamInstance extends Dream,
  Schema = DreamInstance['schema'],
  SchemaColumns = Schema[DreamInstance['table'] & keyof Schema]['columns' &
    keyof Schema[DreamInstance['table'] & keyof Schema]],
> = {
  -readonly [K in keyof SchemaColumns]: SchemaColumns[K]['dbType' & keyof SchemaColumns[K]]
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
  EncryptedColumns = DreamEncryptedColumns<InstanceType<DreamClass>>,
> = Partial<
  Updateable<InstanceType<DreamClass>['DB'][TableName]> &
    (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object) &
    (EncryptedColumns extends readonly any[] ? Record<EncryptedColumns[number], any> : object) &
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
  EncryptedColumns = DreamEncryptedColumns<I>,
> = Partial<
  Updateable<I['DB'][TableName]> &
    (VirtualColumns extends readonly any[] ? Record<VirtualColumns[number], any> : object) &
    (EncryptedColumns extends readonly any[] ? Record<EncryptedColumns[number], any> : object) &
    (AssociatedModelParam<I> extends never ? object : AssociatedModelParam<I>)
>

// Model global names and tables
export type TableNameForGlobalModelName<
  I extends Dream,
  GMN extends GlobalModelNames<I>,
> = GlobalModelNameTableMap<I>[GMN]

export type GlobalModelNames<I extends Dream> = keyof GlobalModelNameTableMap<I>

type GlobalModelNameTableMap<
  I extends Dream,
  GlobalSchema = I['globalSchema'],
  GlobalNames = GlobalSchema['globalNames' & keyof GlobalSchema],
> = GlobalNames['models' & keyof GlobalNames]
// end:Model global names and tables

// Serializer global names
export type GlobalSerializerName<I extends Dream> = GlobalSerializerNames<I>[number]

type GlobalSerializerNames<
  I extends Dream,
  GlobalSchema = I['globalSchema'],
  GlobalNames = GlobalSchema['globalNames' & keyof GlobalSchema],
> = GlobalNames['serializers' & keyof GlobalNames]
// end:Serializer global names

export type DreamSerializers<I extends Dream> = Record<'default', GlobalSerializerName<I>> &
  Record<string, GlobalSerializerName<I>>

export type DreamConstructorType<T extends Dream> = (new (...arguments_: any[]) => T) & typeof Dream

export type ViewModel = { serializers: Record<string, string> }
export type ViewModelClass = abstract new (...args: any) => ViewModel

export type SerializableDreamOrViewModel = ViewModel
export type SerializableDreamClassOrViewModelClass = abstract new (
  ...args: any
) => SerializableDreamOrViewModel

export type DreamSerializerCallback = () => typeof DreamSerializer
export type SerializableClassOrSerializerCallback =
  | SerializableDreamClassOrViewModelClass
  | DreamSerializerCallback

export type SerializableClassOrClasses =
  | DreamSerializerCallback
  | SerializableDreamClassOrViewModelClass
  | SerializableDreamClassOrViewModelClass[]

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

export type AssociationNameToDreamClass = Record<string, typeof Dream>
export type AssociationNameToAssociation = Record<
  string,
  | BelongsToStatement<any, any, any, any>
  | HasOneStatement<any, any, any, any>
  | HasManyStatement<any, any, any, any>
>
export type AssociationNameToAssociationDataAndDreamClass = Record<
  string,
  {
    dreamClass: typeof Dream
    association:
      | BelongsToStatement<any, any, any, any>
      | HasOneStatement<any, any, any, any>
      | HasManyStatement<any, any, any, any>
  }
>

type IdToDreamMap = Record<string, Dream>
export type AliasToDreamIdMap = Record<string, IdToDreamMap>

export type RelaxedPreloadStatement<Depth extends number = 0> = RelaxedJoinStatement<Depth>

export type RelaxedJoinStatement<Depth extends number = 0> = Depth extends 7
  ? object
  : Record<string, RelaxedJoinStatement<Inc<Depth>>>

export type RelaxedPreloadWhereStatement<DB, Schema, Depth extends number = 0> = RelaxedJoinWhereStatement<
  DB,
  Schema,
  Depth
>

export type RelaxedJoinWhereStatement<DB, Schema, Depth extends number = 0> = Depth extends 7
  ? object
  : {
      [key: string]: RelaxedJoinWhereStatement<DB, Schema, Inc<Depth>> | FakeWhereClauseValue | object
    }

// Just need something that is not an object, but that could be an array and also null
type FakeWhereClauseValue = string | string[] | number | number[] | null

export type TableOrAssociationName<Schema> = (keyof Schema & string) | (keyof Schema[keyof Schema] & string)

export type SqlCommandType = 'select' | 'update' | 'delete' | 'insert'

export type DreamSerializeOptions<T> = {
  serializerKey?: DreamSerializerKey<T>
  casing?: 'camel' | 'snake' | null
}

export type DreamOrViewModelSerializerKey<T> = T extends Dream
  ? DreamSerializerKey<T>
  : ViewModelSerializerKey<T>

export type DreamSerializerKey<
  T,
  U = T extends (infer R)[] ? R : T,
  Table = U['table' & keyof U] extends string ? U['table' & keyof U] : never,
  Schema = U['schema' & keyof U] extends object ? U['schema' & keyof U] : never,
  TableSchema = Table extends never ? never : Schema extends never ? never : Schema[Table & keyof Schema],
  SerializerKeys = TableSchema extends never
    ? never
    : TableSchema['serializerKeys' & keyof TableSchema] & (string[] | Readonly<string[]>),
  SerializerKey = SerializerKeys extends string[] | Readonly<string[]> ? SerializerKeys[number] : never,
> = SerializerKey

export type ViewModelSerializerKey<
  T,
  U = T extends (infer R)[] ? R : T,
  SerializerType = U extends null
    ? never
    : U['serializers' & keyof U] extends object
      ? keyof U['serializers' & keyof U]
      : never,
> = SerializerType

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
> = PassthroughColumns

export type DefaultScopeName<
  DreamInstance extends Dream,
  Schema = DreamInstance['schema'],
  TableName extends keyof Schema = DreamInstance['table'] & keyof Schema,
> = DefaultScopeNameForTable<Schema, TableName>

export type DefaultScopeNameForTable<
  Schema,
  TableName extends keyof Schema,
  SchemaTable = Schema[TableName],
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

type RecursionTypes = 'load' | 'leftJoinLoad' | 'join'

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
  0,
  null,
  never,
  AllowedNextArgValues | AllowedNextArgValues[]
>
///////////////////////////////
// end: VARIADIC LOAD
///////////////////////////////

///////////////////////////////
// VARIADIC LEFT JOIN LOAD
///////////////////////////////
export type VariadicLeftJoinLoadArgs<
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
  'leftJoinLoad',
  ConcreteTableName,
  0,
  null,
  never,
  AllowedNextArgValues | AllowedNextArgValues[]
>
///////////////////////////////
// end:VARIADIC LEFT JOIN LOAD
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
  'join',
  ConcreteTableName,
  0,
  null,
  never,
  AllowedNextArgValues
>
///////////////////////////////
// end: VARIADIC JOINS
///////////////////////////////

/**
 * @internal
 *
 * Given a list of arguments provided to
 * a variadic function (like preload, etc...), find the final
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
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
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
  RequiredWhereClauses = WhereClauseRequirementsMet extends VALID
    ? null
    : RequiredWhereClauseKeys<Schema, ConcreteTableName, NextAssociationName>,
  //
  AllowedNextArgValues = RequiredWhereClauses extends null
    ? RecursionType extends 'load'
      ? AllowedNextArgValuesForLoad<DB, Schema, NextTableName>
      : RecursionType extends 'leftJoinLoad' | 'join'
        ? AllowedNextArgValuesForJoins<DB, Schema, NextTableName, NextUsedNamespaces>
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

export interface JoinedAssociation {
  table: string
  alias: string
}

export interface QueryTypeOptions {
  joinedAssociations: Readonly<JoinedAssociation[]>
}

export type JoinedAssociationsTypeFromAssociations<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  ConcreteArgs extends readonly unknown[],
  //
  PreviousConcreteTableName = ConcreteTableName,
  ConcreteAssociationName = never,
  //
  JoinedAssociationsType extends Readonly<JoinedAssociation[]> = Readonly<[]>,
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  //

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
  ? JoinedAssociationsType
  : JoinedAssociationsTypeFromAssociations<
      DB,
      Schema,
      NextTableName,
      ReadonlyTail<ConcreteArgs>,
      NextPreviousConcreteTableName,
      NextAssociationName,
      Readonly<
        [...JoinedAssociationsType, { table: NextTableName & string; alias: NextAssociationName & string }]
      >
    >
