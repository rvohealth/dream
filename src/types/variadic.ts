import Dream from '../Dream.js'
import { Camelized } from '../helpers/stringCasing.js'
import { AssociationTableNames } from './db.js'
import {
  AssociationNamesForAssociation,
  AssociationNamesForTable,
  AssociationTableName,
  AssociationTableNamesForAssociation,
  DreamAssociationNameToAssociatedModel,
  JoinAndStatements,
  MAX_VARIADIC_DEPTH,
  RequiredOnClauseKeys,
} from './dream.js'
import { Inc, ReadonlyTail } from './utils.js'

type VALID = 'valid'
type INVALID = 'invalid'
type IS_ASSOCIATION_ALIAS = 'association_alias'
type IS_ASSOCIATION_NAME = 'association_name'
type IS_NOT_ASSOCIATION_NAME = 'not_association_name'
type IS_CROSS_POLYMORPHIC_ASSOCIATION_NAME = 'cross_polymorphic_association_name'
type RecursionTypes = 'load' | 'leftJoinLoad' | 'join'

/**
 * Given a union of table names and an association name, returns the
 * specific table(s) from the union that have that association defined.
 * Used when traversing through a polymorphic association to a descendant
 * that only exists on one of the polymorphic targets.
 */
type TableContainingAssociationInUnion<Schema, TableNamesUnion, AssociationName> =
  TableNamesUnion extends keyof Schema
    ? AssociationName extends keyof Schema[TableNamesUnion]['associations' & keyof Schema[TableNamesUnion]]
      ? TableNamesUnion
      : never
    : never
///////////////////////////////
// VARIADIC LOAD
///////////////////////////////

export type VariadicLoadArgs<
  I extends Dream,
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  ConcreteArgs extends readonly unknown[],
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  AllowedNextArgValues =
    | (keyof SchemaAssociations & string)
    | AliasedSchemaAssociation<Schema, ConcreteTableName>,
> = VariadicCheckThenRecurse<
  I,
  DB,
  Schema,
  ConcreteTableName,
  ConcreteArgs,
  'load',
  ConcreteTableName,
  0,
  null,
  never,
  AllowedNextArgValues | Readonly<AllowedNextArgValues[]>
>
///////////////////////////////
// end: VARIADIC LOAD
///////////////////////////////
///////////////////////////////
// VARIADIC LEFT JOIN LOAD
///////////////////////////////
export type VariadicLeftJoinLoadArgs<
  I extends Dream,
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  ConcreteArgs extends readonly unknown[],
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  AllowedNextArgValues =
    | (keyof SchemaAssociations & string)
    | AliasedSchemaAssociation<Schema, ConcreteTableName>,
> = VariadicCheckThenRecurse<
  I,
  DB,
  Schema,
  ConcreteTableName,
  ConcreteArgs,
  'leftJoinLoad',
  // Dream configures Kysely to use camel case in Typescript land and
  // convert to snake case in SQL; however, Dream reference snake-cased table names.
  // Without camelizing, the table name of the starting model could conflict with the
  // snake-cased version of an association name. By camelizing the table that goes
  // into the UsedNamespaces, we prevent this from happeing at the type level.
  Camelized<ConcreteTableName>,
  0,
  null,
  never,
  AllowedNextArgValues | Readonly<AllowedNextArgValues[]>
>
///////////////////////////////
// end:VARIADIC LEFT JOIN LOAD
///////////////////////////////
///////////////////////////////
// VARIADIC JOINS
///////////////////////////////
export type VariadicJoinsArgs<
  I extends Dream,
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  ConcreteArgs extends readonly unknown[],
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  AllowedNextArgValues =
    | (keyof SchemaAssociations & string)
    | AliasedSchemaAssociation<Schema, ConcreteTableName>,
> = VariadicCheckThenRecurse<
  I,
  DB,
  Schema,
  ConcreteTableName,
  ConcreteArgs,
  'join',
  // Dream configures Kysely to use camel case in Typescript land and
  // convert to snake case in SQL; however, Dream reference snake-cased table names.
  // Without camelizing, the table name of the starting model could conflict with the
  // snake-cased version of an association name. By camelizing the table that goes
  // into the UsedNamespaces, we prevent this from happeing at the type level.
  // Camelized<ConcreteTableName>,
  Camelized<ConcreteTableName>,
  0,
  null,
  never,
  AllowedNextArgValues
>
///////////////////////////////
// end: VARIADIC JOINS
///////////////////////////////

type VariadicCheckThenRecurse<
  I extends Dream,
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
  AssociationNamesOrOnClause,
  LastDream extends Dream = I,
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  AllowedNamesForArrayArg = PreviousConcreteTableName extends keyof Schema
    ? AssociationNamesForAssociation<Schema, PreviousConcreteTableName, ConcreteAssociationName>
    : keyof SchemaAssociations & string,
  NthArgument extends VALID | INVALID = ConcreteArgs['length'] extends 0
    ? VALID
    : ConcreteArgs[0] extends keyof SchemaAssociations & string
      ? VALID
      : ConcreteArgs[0] extends AliasedSchemaAssociation<Schema, ConcreteTableName>
        ? VALID
        : ConcreteArgs[0] extends JoinAndStatements<
              LastDream,
              DB,
              Schema,
              ConcreteTableName,
              RequiredOnClauseKeys<Schema, PreviousConcreteTableName, ConcreteAssociationName>
            >
          ? VALID
          : ConcreteArgs[0] extends readonly AllowedNamesForArrayArg[]
            ? VALID
            : ConcreteArgs[0] extends JoinAndStatements<
                  LastDream,
                  DB,
                  Schema,
                  ConcreteTableName,
                  RequiredOnClauseKeys<Schema, PreviousConcreteTableName, ConcreteAssociationName>
                >
              ? VALID
              : ConcreteArgs[0] extends AllowedNamesForArrayArg
                ? VALID
                : INVALID,
> = NthArgument extends INVALID
  ? `invalid where clause in argument ${Inc<Depth>}`
  : ConcreteArgs['length'] extends 0
    ? AssociationNamesOrOnClause
    : VariadicRecurse<
        I,
        DB,
        Schema,
        ConcreteTableName,
        ConcreteArgs,
        RecursionType,
        UsedNamespaces,
        Depth,
        PreviousConcreteTableName,
        ConcreteAssociationName,
        LastDream
      >

export type AliasedSchemaAssociation<
  Schema,
  ConcreteTableName extends keyof Schema,
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
> = `${keyof SchemaAssociations & string} as ${string}`

type VariadicRecurse<
  I extends Dream,
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
  LastDream extends Dream,
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  // Union of all table names reachable via the previous polymorphic association.
  // When PreviousConcreteTableName is not a schema key (e.g. at depth 0), fall back to ConcreteTableName.
  PolymorphicTableNamesUnion = PreviousConcreteTableName extends keyof Schema
    ? AssociationTableNamesForAssociation<Schema, PreviousConcreteTableName, ConcreteAssociationName>
    : ConcreteTableName,
  // The specific table from the polymorphic union that owns the current arg as an association.
  // Used when the arg is not directly on ConcreteTableName (i.e. cross-polymorphic traversal).
  CrossPolymorphicTableForCurrentArg = ConcreteArgs[0] extends string
    ? TableContainingAssociationInUnion<Schema, PolymorphicTableNamesUnion, ConcreteArgs[0]>
    : never,
  // The effective table for looking up the current arg's association:
  // - ConcreteTableName when the arg is directly on it (normal case)
  // - CrossPolymorphicTableForCurrentArg when the arg is on a different table in the polymorphic union
  // Note: we use [T] extends [never] (non-distributive) to guard against CrossPolymorphicTableForCurrentArg
  // being `never`, because `never extends X` is vacuously true and would cause EffectiveConcreteTableName
  // to become `never` if we used a plain conditional.
  EffectiveConcreteTableName extends keyof Schema &
    AssociationTableNames<DB, Schema> &
    keyof DB = ConcreteArgs[0] extends keyof SchemaAssociations & string
    ? ConcreteTableName
    : [CrossPolymorphicTableForCurrentArg] extends [never]
      ? ConcreteTableName
      : CrossPolymorphicTableForCurrentArg extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB
        ? CrossPolymorphicTableForCurrentArg
        : ConcreteTableName,
  // Schema associations on the effective table (may differ from SchemaAssociations when cross-polymorphic).
  EffectiveSchemaAssociations = Schema[EffectiveConcreteTableName]['associations' &
    keyof Schema[EffectiveConcreteTableName]],
  ConcreteNthArg extends
    | (keyof SchemaAssociations & string)
    | (keyof EffectiveSchemaAssociations & string)
    | AliasedSchemaAssociation<Schema, ConcreteTableName>
    | null = ConcreteArgs[0] extends undefined
    ? null
    : ConcreteArgs[0] extends null
      ? null
      : ConcreteArgs[0] extends keyof SchemaAssociations & string
        ? ConcreteArgs[0] & keyof SchemaAssociations & string
        : ConcreteArgs[0] extends AliasedSchemaAssociation<Schema, ConcreteTableName>
          ? ConcreteArgs[0] & AliasedSchemaAssociation<Schema, ConcreteTableName>
          : ConcreteArgs[0] extends keyof EffectiveSchemaAssociations & string
            ? ConcreteArgs[0] & keyof EffectiveSchemaAssociations & string
            : null,
  NextUsedNamespaces = ConcreteArgs[0] extends undefined
    ? never
    : ConcreteArgs[0] extends null
      ? never
      : ConcreteNthArg extends null
        ? UsedNamespaces
        : UsedNamespaces | ConcreteNthArg,
  //
  CurrentArgumentType extends
    | IS_ASSOCIATION_NAME
    | IS_ASSOCIATION_ALIAS
    | IS_CROSS_POLYMORPHIC_ASSOCIATION_NAME
    | IS_NOT_ASSOCIATION_NAME = ConcreteNthArg extends null
    ? IS_NOT_ASSOCIATION_NAME
    : ConcreteNthArg extends keyof SchemaAssociations & string
      ? IS_ASSOCIATION_NAME
      : ConcreteNthArg extends AliasedSchemaAssociation<Schema, ConcreteTableName>
        ? IS_ASSOCIATION_ALIAS
        : ConcreteNthArg extends keyof EffectiveSchemaAssociations & string
          ? IS_CROSS_POLYMORPHIC_ASSOCIATION_NAME
          : IS_NOT_ASSOCIATION_NAME,
  //
  NextPreviousConcreteTableName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteTableName
    : CurrentArgumentType extends IS_ASSOCIATION_ALIAS
      ? ConcreteTableName
      : CurrentArgumentType extends IS_CROSS_POLYMORPHIC_ASSOCIATION_NAME
        ? EffectiveConcreteTableName
        : PreviousConcreteTableName,
  //
  NextUnaliasedAssociationName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteNthArg
    : CurrentArgumentType extends IS_ASSOCIATION_ALIAS
      ? ConcreteNthArg extends `${infer AssocName extends string} as ${string}`
        ? AssocName & keyof SchemaAssociations & string
        : never
      : CurrentArgumentType extends IS_CROSS_POLYMORPHIC_ASSOCIATION_NAME
        ? ConcreteNthArg
        : never,
  //
  NextAliasedAssociationName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteNthArg
    : CurrentArgumentType extends IS_ASSOCIATION_ALIAS
      ? ConcreteNthArg extends `${string} as ${infer AssocAlias extends string}`
        ? AssocAlias & string
        : ConcreteAssociationName
      : CurrentArgumentType extends IS_CROSS_POLYMORPHIC_ASSOCIATION_NAME
        ? ConcreteNthArg
        : ConcreteAssociationName,
  //
  IsAssociationNameOrAlias extends boolean = CurrentArgumentType extends
    | IS_ASSOCIATION_NAME
    | IS_ASSOCIATION_ALIAS
    | IS_CROSS_POLYMORPHIC_ASSOCIATION_NAME
    ? true
    : false,
  //
  NextTableName extends keyof Schema &
    AssociationTableNames<DB, Schema> &
    keyof DB = IsAssociationNameOrAlias extends true
    ? AssociationTableName<Schema, EffectiveConcreteTableName, NextUnaliasedAssociationName>
    : ConcreteTableName & AssociationTableNames<DB, Schema> & keyof DB,
  //
  AllowedAssociationNames = IsAssociationNameOrAlias extends true
    ? AssociationNamesForAssociation<Schema, EffectiveConcreteTableName, NextUnaliasedAssociationName>
    : PreviousConcreteTableName extends keyof Schema
      ? AssociationNamesForAssociation<Schema, PreviousConcreteTableName, ConcreteAssociationName>
      : AssociationNamesForTable<Schema, ConcreteTableName>, // fall back to association names for table for root only
  //
  AssociationTableOrConcreteTable extends keyof Schema &
    AssociationTableNames<DB, Schema> &
    keyof DB = IsAssociationNameOrAlias extends true
    ? AssociationTableName<Schema, EffectiveConcreteTableName, NextUnaliasedAssociationName>
    : ConcreteTableName,
  //
  CurrentRequiredOnClauseKeys = IsAssociationNameOrAlias extends true
    ? RequiredOnClauseKeys<Schema, EffectiveConcreteTableName, NextAliasedAssociationName>
    : RequiredOnClauseKeys<Schema, PreviousConcreteTableName, ConcreteAssociationName>,
  //
  AllowedNextArgValues = RecursionType extends 'load'
    ? AllowedNextArgValuesForLoad<
        DreamAssociationNameToAssociatedModel<LastDream, ConcreteArgs[0] & keyof LastDream>,
        DB,
        Schema,
        AllowedAssociationNames,
        AssociationTableOrConcreteTable,
        CurrentRequiredOnClauseKeys
      >
    : RecursionType extends 'leftJoinLoad'
      ? AllowedNextArgValuesForLeftJoinLoad<
          DreamAssociationNameToAssociatedModel<LastDream, ConcreteArgs[0] & keyof LastDream>,
          DB,
          Schema,
          AllowedAssociationNames,
          AssociationTableOrConcreteTable,
          CurrentRequiredOnClauseKeys,
          NextUsedNamespaces
        >
      : RecursionType extends 'join'
        ? AllowedNextArgValuesForJoin<
            DreamAssociationNameToAssociatedModel<LastDream, ConcreteArgs[0] & keyof LastDream>,
            DB,
            Schema,
            AllowedAssociationNames,
            AssociationTableOrConcreteTable,
            CurrentRequiredOnClauseKeys,
            NextUsedNamespaces
          >
        : never,
> = Depth extends MAX_VARIADIC_DEPTH
  ? never
  : VariadicCheckThenRecurse<
      I,
      DB,
      Schema,
      NextTableName,
      ReadonlyTail<ConcreteArgs>,
      RecursionType,
      NextUsedNamespaces,
      Inc<Depth>,
      NextPreviousConcreteTableName,
      NextAliasedAssociationName,
      AllowedNextArgValues,
      DreamAssociationNameToAssociatedModel<LastDream, ConcreteArgs[0] & keyof LastDream> extends Dream
        ? DreamAssociationNameToAssociatedModel<LastDream, ConcreteArgs[0] & keyof LastDream>
        : LastDream
    >

type AllowedNextArgValuesForLoad<
  I extends Dream,
  DB,
  Schema,
  AllowedNames,
  TableForJoin extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  RequiredOnClauseKeysForThisAssociation,
> =
  | AllowedNames
  | AllowedNames[]
  | JoinAndStatements<I, DB, Schema, TableForJoin, RequiredOnClauseKeysForThisAssociation>

type AllowedNextArgValuesForLeftJoinLoad<
  I extends Dream,
  DB,
  Schema,
  AllowedNames,
  TableForJoin extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  RequiredOnClauseKeysForThisAssociation,
  UsedNamespaces,
> =
  | Exclude<AllowedNames, UsedNamespaces>
  | Exclude<AllowedNames, UsedNamespaces>[]
  | JoinAndStatements<I, DB, Schema, TableForJoin, RequiredOnClauseKeysForThisAssociation>

type AllowedNextArgValuesForJoin<
  I extends Dream,
  DB,
  Schema,
  AllowedNames,
  TableForJoin extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  RequiredOnClauseKeysForThisAssociation,
  UsedNamespaces,
> =
  | Exclude<AllowedNames, UsedNamespaces>
  | JoinAndStatements<I, DB, Schema, TableForJoin, RequiredOnClauseKeysForThisAssociation>

export interface JoinedAssociation {
  table: string
  alias: string
}

export type QueryTypeOptions = {
  joinedAssociations: Readonly<JoinedAssociation[]>
  rootTableName: string
  rootTableAlias: string
  allowPreload: boolean
  allowLeftJoinPreload: boolean
  allowLimit: boolean
  allowOffset: boolean
  allowPaginate: boolean
}

export type JoinedAssociationsTypeFromAssociations<
  DB,
  Schema,
  ConcreteTableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  ConcreteArgs extends readonly unknown[],
  Depth extends number = 0,
  //
  //
  PreviousConcreteTableName = ConcreteTableName,
  ConcreteAssociationName = never,
  //
  JoinedAssociationsType extends Readonly<JoinedAssociation[]> = Readonly<[]>,
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  //
  ConcreteNthArg extends
    | (keyof SchemaAssociations & string)
    | AliasedSchemaAssociation<Schema, ConcreteTableName>
    | Readonly<unknown[]>
    | null = ConcreteArgs[0] extends undefined
    ? null
    : ConcreteArgs[0] extends null
      ? null
      : ConcreteArgs[0] extends keyof SchemaAssociations & string
        ? ConcreteArgs[0] & keyof SchemaAssociations & string
        : ConcreteArgs[0] extends AliasedSchemaAssociation<Schema, ConcreteTableName>
          ? ConcreteArgs[0] & AliasedSchemaAssociation<Schema, ConcreteTableName>
          : ConcreteArgs[0] extends Readonly<unknown[]>
            ? Readonly<unknown[]>
            : null,
  //
  CurrentArgumentType extends
    | IS_ASSOCIATION_NAME
    | IS_ASSOCIATION_ALIAS
    | IS_NOT_ASSOCIATION_NAME = ConcreteNthArg extends null
    ? IS_NOT_ASSOCIATION_NAME
    : ConcreteNthArg extends Readonly<unknown[]>
      ? IS_NOT_ASSOCIATION_NAME
      : ConcreteNthArg extends keyof SchemaAssociations & string
        ? IS_ASSOCIATION_NAME
        : ConcreteNthArg extends AliasedSchemaAssociation<Schema, ConcreteTableName>
          ? IS_ASSOCIATION_ALIAS
          : IS_NOT_ASSOCIATION_NAME,
  //
  NextPreviousConcreteTableName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteTableName
    : CurrentArgumentType extends IS_ASSOCIATION_ALIAS
      ? ConcreteTableName
      : PreviousConcreteTableName,
  //
  NextUnaliasedAssociationName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteNthArg
    : CurrentArgumentType extends IS_ASSOCIATION_ALIAS
      ? ConcreteNthArg extends `${infer AssocName extends string} as ${string}`
        ? AssocName & keyof SchemaAssociations
        : never
      : never,
  //
  NextAliasedAssociationName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteNthArg
    : CurrentArgumentType extends IS_ASSOCIATION_ALIAS
      ? ConcreteNthArg extends `${string} as ${infer Alias extends string}`
        ? Alias
        : ConcreteAssociationName
      : ConcreteAssociationName,
  //
  NextTableName extends keyof Schema &
    AssociationTableNames<DB, Schema> &
    keyof DB = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? AssociationTableName<Schema, ConcreteTableName, NextUnaliasedAssociationName>
    : CurrentArgumentType extends IS_ASSOCIATION_ALIAS
      ? AssociationTableName<Schema, ConcreteTableName, NextUnaliasedAssociationName>
      : ConcreteTableName & AssociationTableNames<DB, Schema> & keyof DB,
> = ConcreteArgs['length'] extends 0
  ? JoinedAssociationsType
  : Depth extends MAX_VARIADIC_DEPTH
    ? never
    : ConcreteArgs['length'] extends 1
      ? ConcreteNthArg extends Readonly<unknown[]>
        ? JoinedAssociationsType
        : JoinedAssociationsTypeFromAssociations<
            DB,
            Schema,
            NextTableName,
            ReadonlyTail<ConcreteArgs>,
            Inc<Depth>,
            NextPreviousConcreteTableName,
            NextAliasedAssociationName,
            CurrentArgumentType extends IS_NOT_ASSOCIATION_NAME
              ? JoinedAssociationsType
              : Readonly<
                  [
                    ...JoinedAssociationsType,
                    { table: NextTableName & string; alias: NextAliasedAssociationName & string },
                  ]
                >
          >
      : JoinedAssociationsTypeFromAssociations<
          DB,
          Schema,
          NextTableName,
          ReadonlyTail<ConcreteArgs>,
          Inc<Depth>,
          NextPreviousConcreteTableName,
          NextAliasedAssociationName,
          CurrentArgumentType extends IS_NOT_ASSOCIATION_NAME
            ? JoinedAssociationsType
            : Readonly<
                [
                  ...JoinedAssociationsType,
                  { table: NextTableName & string; alias: NextAliasedAssociationName & string },
                ]
              >
        >
