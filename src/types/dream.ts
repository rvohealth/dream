import { ColumnType, Updateable } from 'kysely'
import { STI_SCOPE_NAME } from '../decorators/class/STI.js'
import Dream from '../Dream.js'
import { primaryKeyTypes, TRIGRAM_OPERATORS } from '../dream/constants.js'
import CalendarDate from '../helpers/CalendarDate.js'
import { DateTime } from '../helpers/DateTime.js'
import OpsStatement from '../ops/ops-statement.js'
import {
  AssociatedModelParam,
  AssociationStatement,
  OnStatementForAssociation,
  WhereStatement,
} from './associations/shared.js'
import { AssociationTableNames } from './db.js'
import { FindEachOpts } from './query.js'
import { DreamModelSerializerType, SimpleObjectSerializerType } from './serializer.js'
import { FilterInterface, Inc } from './utils.js'
import { AliasedSchemaAssociation, RequiredOnClauseKeys } from './variadic.js'

export type PrimaryKeyType = (typeof primaryKeyTypes)[number]

export type DreamPrimaryKeyType<
  I extends Dream,
  Schema extends I['schema'] = I['schema'],
  TableName extends keyof Schema = I['table'] & keyof Schema,
  PrimaryKey extends I['primaryKey' & keyof I] extends undefined
    ? 'id'
    : I['primaryKey' & keyof I] = I['primaryKey' & keyof I] extends undefined
    ? 'id'
    : I['primaryKey' & keyof I],
> = Schema[TableName]['columns'][PrimaryKey & keyof Schema[TableName]['columns']]['coercedType']

export type Timestamp = ColumnType<DateTime | CalendarDate>

export type MAX_VARIADIC_DEPTH = 25
export type TrigramOperator = (typeof TRIGRAM_OPERATORS)[number]
export type OrderDir = 'asc' | 'desc'

export interface SortableOptions<T extends Dream> {
  scope?:
    | keyof DreamBelongsToAssociationMetadata<T>
    | DreamColumnNames<T>
    | (keyof DreamBelongsToAssociationMetadata<T> | DreamColumnNames<T>)[]
}

export type PrimaryKeyForFind<
  I extends Dream,
  PrimaryKeyType extends DreamPrimaryKeyType<I> = DreamPrimaryKeyType<I>,
> = PrimaryKeyType extends bigint
  ? bigint | number | string | null | undefined
  : PrimaryKeyType | string | null | undefined

export type DreamColumnNames<
  DreamInstance extends Dream,
  // This should be analogous to the below, DB table based approach, but it breaks Psychic paramsFor
  //   Schema extends DreamInstance['schema'] = DreamInstance['schema'],
  //   TableName extends DreamInstance['table'] & keyof Schema = DreamInstance['table'] & keyof Schema,
  //   AttributeName extends keyof Schema[TableName]['columns'] & string = keyof Schema[TableName]['columns'] &
  //     string,
  // > = AttributeName
  DB = DreamInstance['DB'],
  TableName extends keyof DB = DreamInstance['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
  AttributeName extends keyof Table & string = keyof Table & string,
> = AttributeName

export type NonJsonDreamColumnNames<
  DreamInstance extends Dream,
  Schema extends DreamInstance['schema'] = DreamInstance['schema'],
  TableName extends DreamInstance['table'] & keyof Schema = DreamInstance['table'] & keyof Schema,
  AttributeName extends Exclude<Schema[TableName]['nonJsonColumnNames'][number], keyof Dream> &
    string = Exclude<Schema[TableName]['nonJsonColumnNames'][number], keyof Dream> & string,
> = AttributeName

export type DreamParamSafeColumnNames<
  DreamInstance extends Dream,
  BelongsToForeignKeys = DreamBelongsToForeignKeys<DreamInstance>,
> = Exclude<
  keyof UpdateableProperties<DreamInstance>,
  | BelongsToForeignKeys
  | (DreamInstance['primaryKey' & keyof DreamInstance] extends undefined
      ? 'id'
      : DreamInstance['primaryKey' & keyof DreamInstance])
  | (DreamInstance['createdAtField' & keyof DreamInstance] extends undefined
      ? 'createdAt'
      : DreamInstance['createdAtField' & keyof DreamInstance])
  | (DreamInstance['updatedAtField' & keyof DreamInstance] extends undefined
      ? 'updatedAt'
      : DreamInstance['updatedAtField' & keyof DreamInstance])
  | (DreamInstance['deletedAtField' & keyof DreamInstance] extends undefined
      ? 'deletedAt'
      : DreamInstance['deletedAtField' & keyof DreamInstance])
  | 'type'
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

export type AssociationNameToDream<
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

export type DreamAssociationNamesWithoutRequiredOnClauses<
  DreamInstance extends Dream,
  SchemaAssociations = DreamAssociationMetadata<DreamInstance>,
  SchemaTypeInterface = {
    [K in keyof SchemaAssociations]: SchemaAssociations[K]['requiredOnClauses' & keyof SchemaAssociations[K]]
  },
  RequiredOnClauses = keyof FilterInterface<SchemaTypeInterface, null> & string,
> = RequiredOnClauses

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
  [K in keyof UpdateableProperties<DreamInstance> &
    DreamParamSafeColumnNames<DreamInstance>]: UpdateableProperties<DreamInstance>[K]
}

export type DreamTableSchema<DreamInstance extends Dream> = Updateable<
  DreamInstance['DB'][DreamInstance['table']]
>

export type ModelColumnType<
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

export type TableColumnType<
  Schema,
  TableName,
  Column,
  TableSchema extends Schema[TableName & keyof Schema] = Schema[TableName & keyof Schema],
  TableColumns extends TableSchema['columns' & keyof TableSchema] = TableSchema['columns' &
    keyof TableSchema],
  TableColumnMetadata extends TableColumns[Column & keyof TableColumns] = TableColumns[Column &
    keyof TableColumns],
  ColumnType extends TableColumnMetadata['dbType' &
    keyof TableColumnMetadata] = TableColumnMetadata['dbType' & keyof TableColumnMetadata],
> = ColumnType

export type TableColumnEnumTypeArray<
  Schema,
  TableName,
  Column,
  TableSchema extends Schema[TableName & keyof Schema] = Schema[TableName & keyof Schema],
  TableColumns extends TableSchema['columns' & keyof TableSchema] = TableSchema['columns' &
    keyof TableSchema],
  TableColumnMetadata extends TableColumns[Column & keyof TableColumns] = TableColumns[Column &
    keyof TableColumns],
  EnumTypeCandidate = TableColumnMetadata['enumArrayType' & keyof TableColumnMetadata],
  EnumTypeArray extends string[] | null = EnumTypeCandidate extends null
    ? null
    : EnumTypeCandidate extends undefined
      ? null
      : EnumTypeCandidate extends string[]
        ? EnumTypeCandidate
        : never,
> = EnumTypeArray

///////////////////////////
// Association type helpers
///////////////////////////
type AssociationMetadataForTable<Schema, TableName extends keyof Schema> = Schema[TableName]['associations' &
  keyof Schema[TableName]]

export type AssociationNamesForTable<Schema, TableName extends keyof Schema> =
  | keyof AssociationMetadataForTable<Schema, TableName>
  | AliasedSchemaAssociation<Schema, TableName>

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

export type DreamClassAssociationAndStatement<
  DreamClass extends typeof Dream,
  AssociationName,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  Schema extends DreamInstance['schema'] = DreamInstance['schema'],
  TableName extends DreamInstance['table'] = DreamInstance['table'],
  AssocTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB = AssociationTableName<
    Schema,
    TableName,
    AssociationName
  >,
  RequiredOnClauseKeysForThisAssociation extends RequiredOnClauseKeys<
    Schema,
    TableName,
    AssociationName
  > = RequiredOnClauseKeys<Schema, TableName, AssociationName>,
  Statements extends JoinAndStatements<
    DB,
    Schema,
    AssocTableName,
    RequiredOnClauseKeysForThisAssociation
  > = JoinAndStatements<DB, Schema, AssocTableName, RequiredOnClauseKeysForThisAssociation>,
> = Statements

export type JoinAndStatements<
  DB,
  Schema,
  TableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  RequiredOnClauseKeysForThisAssociation,
> = RequiredOnClauseKeysForThisAssociation extends null
  ? {
      and?: WhereStatement<DB, Schema, TableName>
      andNot?: WhereStatement<DB, Schema, TableName>
      // andNot?: WhereStatementWithoutSimilarityClauses<DB, Schema, TableName>
      andAny?: WhereStatement<DB, Schema, TableName>[]
      // andAny?: WhereStatementWithoutSimilarityClauses<DB, Schema, TableName>[]
    }
  : RequiredOnClauseKeysForThisAssociation extends string[]
    ? {
        and: OnStatementForAssociation<DB, Schema, TableName, RequiredOnClauseKeysForThisAssociation>
        andNot?: WhereStatement<DB, Schema, TableName>
        // andNot?: WhereStatementWithoutSimilarityClauses<DB, Schema, TableName>
        andAny?: WhereStatement<DB, Schema, TableName>[]
        // andAny?: WhereStatementWithoutSimilarityClauses<DB, Schema, TableName>[]
      }
    : never
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

export interface CreateOrFindByExtraOpts<T extends typeof Dream> {
  createWith?: UpdateablePropertiesForClass<T>
}

export interface UpdateOrCreateByExtraOpts<T extends typeof Dream> {
  with?: UpdateablePropertiesForClass<T>
  skipHooks?: boolean
}

// Model global names and tables
export type TableNameForGlobalModelName<
  I extends Dream,
  GMN extends keyof GlobalModelNameTableMap<I>,
> = GlobalModelNameTableMap<I>[GMN]

export type GlobalModelNames<I extends Dream> = keyof GlobalModelNameTableMap<I>

export type GlobalModelNameTableMap<
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

export type ViewModel = {
  serializers: Record<string, DreamModelSerializerType | SimpleObjectSerializerType | string>
}
export type ViewModelClass = abstract new (...args: any) => ViewModel

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

export type AssociationNameToDreamClassMap = Record<string, typeof Dream>
export type AssociationNameToAssociationMap = Record<string, AssociationStatement>
export type AssociationNameToAssociationDataAndDreamClassMap = Record<
  string,
  {
    dreamClass: typeof Dream
    association: AssociationStatement
  }
>

type IdToDreamMap = Map<string | number, Dream>
export type AliasToDreamIdMap = Record<string, IdToDreamMap>

export type RelaxedPreloadStatement<Depth extends number = 0> = RelaxedJoinStatement<Depth>

export type RelaxedJoinStatement<Depth extends number = 0> = Depth extends 7
  ? object
  : Record<string, RelaxedJoinStatement<Inc<Depth>>>

export type RelaxedPreloadOnStatement<DB, Schema, Depth extends number = 0> = Depth extends 7
  ? object
  : {
      [key: string]:
        | RelaxedPreloadOnStatement<DB, Schema, Inc<Depth>>
        | JoinAndStatements<any, any, any, any>
        | FakeOnClauseValue
        | object
    }

export type RelaxedJoinAndStatement<DB, Schema, Depth extends number = 0> = Depth extends 7
  ? object
  : {
      [key: string]:
        | RelaxedJoinAndStatement<DB, Schema, Inc<Depth>>
        | JoinAndStatements<any, any, any, any>
        | FakeOnClauseValue
        | object
    }

// Just need something that is not an object, but that could be an array and also null
type FakeOnClauseValue = string | string[] | number | number[] | null

export type TableOrAssociationName<Schema> = (keyof Schema & string) | (keyof Schema[keyof Schema] & string)

export type SqlCommandType = 'select' | 'update' | 'delete' | 'insert'

export type DreamSerializeOptions<T> = {
  serializerKey?: DreamSerializerKey<T>
  casing?: 'camel' | 'snake' | null
}

export type DreamOrViewModelClassSerializerKey<T> = T extends typeof Dream
  ? DreamSerializerKey<InstanceType<T>>
  : T extends ViewModelClass
    ? ViewModelSerializerKey<InstanceType<T>>
    : never

export type DreamOrViewModelSerializerKey<T> = T extends Dream
  ? DreamSerializerKey<T>
  : ViewModelSerializerKey<T>

// export type DreamOrViewModelArray<
//   StartingArray extends readonly DreamOrViewModel[] = [],
//   Depth extends number = 0,
// > = Depth extends 20
//   ? StartingArray
//   : StartingArray | DreamOrViewModelArray<[DreamOrViewModel, ...StartingArray], Inc<Depth>>

export type DreamSerializable =
  | typeof Dream
  | ViewModelClass
  | DreamModelSerializerType
  | SimpleObjectSerializerType

export type DreamSerializableArray<
  StartingArray extends readonly DreamSerializable[] = [],
  Depth extends number = 0,
> = Depth extends 20
  ? StartingArray
  : StartingArray | DreamSerializableArray<[DreamSerializable, ...StartingArray], Inc<Depth>>

export type DreamSerializerKey<
  T,
  Table = T['table' & keyof T] extends string ? T['table' & keyof T] : never,
  Schema = T['schema' & keyof T] extends object ? T['schema' & keyof T] : never,
  TableSchema = Table extends never ? never : Schema extends never ? never : Schema[Table & keyof Schema],
  SerializerKeys = TableSchema extends never
    ? never
    : TableSchema['serializerKeys' & keyof TableSchema] & (string[] | Readonly<string[]>),
  SerializerKey = SerializerKeys extends string[] | Readonly<string[]> ? SerializerKeys[number] : never,
> = SerializerKey

export type ViewModelSerializerKey<
  T,
  SerializerType = T extends null
    ? never
    : T['serializers' & keyof T] extends object
      ? keyof T['serializers' & keyof T]
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

export type PluckEachArgs<ColumnNames extends unknown[], CbArgTypes extends unknown[]> =
  | [...fields: ColumnNames]
  | [...fields: ColumnNames, callback: (...values: CbArgTypes) => void | Promise<void>]
  | [...fields: ColumnNames, callback: (...values: CbArgTypes) => void | Promise<void>, opts: FindEachOpts]
