import { Camelized } from '../helpers/stringCasing.ts'
import { AssociationTableNames } from './db.js'
import {
  AssociationNamesForTable,
  AssociationTableName,
  JoinAndStatements,
  MAX_VARIADIC_DEPTH,
} from './dream.js'
import { Inc, ReadonlyTail } from './utils.ts'

type VALID = 'valid'
type INVALID = 'invalid'
type IS_ASSOCIATION_ALIAS = 'association_alias'
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
  AllowedNextArgValues =
    | (keyof SchemaAssociations & string)
    | AliasedSchemaAssociation<Schema, ConcreteTableName>,
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
  AllowedNextArgValues | Readonly<AllowedNextArgValues[]>
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
  AllowedNextArgValues =
    | (keyof SchemaAssociations & string)
    | AliasedSchemaAssociation<Schema, ConcreteTableName>,
> = VariadicCheckThenRecurse<
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
export type RequiredOnClauseKeys<
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
  RequiredOnClauses = Association extends null
    ? null
    : Association['requiredOnClauses' & keyof Association] & (string[] | null),
> = RequiredOnClauses
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
  AssociationNamesOrOnClause,
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  NthArgument extends VALID | INVALID = ConcreteArgs['length'] extends 0
    ? VALID
    : ConcreteArgs[0] extends keyof SchemaAssociations & string
      ? VALID
      : ConcreteArgs[0] extends AliasedSchemaAssociation<Schema, ConcreteTableName>
        ? VALID
        : ConcreteArgs[0] extends JoinAndStatements<
              DB,
              Schema,
              ConcreteTableName,
              RequiredOnClauseKeys<Schema, PreviousConcreteTableName, ConcreteAssociationName>
            >
          ? VALID
          : INVALID,
> = NthArgument extends INVALID
  ? `invalid where clause in argument ${Inc<Depth>}`
  : ConcreteArgs['length'] extends 0
    ? AssociationNamesOrOnClause
    : VariadicRecurse<
        DB,
        Schema,
        ConcreteTableName,
        ConcreteArgs,
        RecursionType,
        UsedNamespaces,
        Depth,
        PreviousConcreteTableName,
        ConcreteAssociationName
      >

export type AliasedSchemaAssociation<
  Schema,
  ConcreteTableName extends keyof Schema,
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
> = `${keyof SchemaAssociations & string} as ${string}`
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
  //
  SchemaAssociations = Schema[ConcreteTableName]['associations' & keyof Schema[ConcreteTableName]],
  ConcreteNthArg extends
    | (keyof SchemaAssociations & string)
    | AliasedSchemaAssociation<Schema, ConcreteTableName>
    | null = ConcreteArgs[0] extends undefined
    ? null
    : ConcreteArgs[0] extends null
      ? null
      : ConcreteArgs[0] extends keyof SchemaAssociations & string
        ? ConcreteArgs[0] & keyof SchemaAssociations & string
        : ConcreteArgs[0] extends AliasedSchemaAssociation<Schema, ConcreteTableName>
          ? ConcreteArgs[0] & AliasedSchemaAssociation<Schema, ConcreteTableName>
          : null,
  NextUsedNamespaces = ConcreteArgs[0] extends undefined
    ? never
    : ConcreteArgs[0] extends null
      ? never
      : ConcreteArgs[0] extends keyof SchemaAssociations & string
        ? UsedNamespaces | ConcreteNthArg
        : UsedNamespaces,
  //
  CurrentArgumentType extends
    | IS_ASSOCIATION_NAME
    | IS_ASSOCIATION_ALIAS
    | IS_NOT_ASSOCIATION_NAME = ConcreteNthArg extends null
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
        ? AssocName & keyof SchemaAssociations & string
        : never
      : never,
  //
  NextAliasedAssociationName = CurrentArgumentType extends IS_ASSOCIATION_NAME
    ? ConcreteNthArg
    : CurrentArgumentType extends IS_ASSOCIATION_ALIAS
      ? ConcreteNthArg extends `${string} as ${infer AssocAlias extends string}`
        ? AssocAlias & string
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
  //
  AllowedNextArgValues = RecursionType extends 'load'
    ? AllowedNextArgValuesForLoad<
        DB,
        Schema,
        NextTableName,
        RequiredOnClauseKeys<Schema, ConcreteTableName, NextAliasedAssociationName>
      >
    : RecursionType extends 'leftJoinLoad'
      ? AllowedNextArgValuesForLeftJoinLoad<
          DB,
          Schema,
          NextTableName,
          RequiredOnClauseKeys<Schema, ConcreteTableName, NextAliasedAssociationName>,
          NextUsedNamespaces
        >
      : RecursionType extends 'join'
        ? AllowedNextArgValuesForJoin<
            DB,
            Schema,
            NextTableName,
            RequiredOnClauseKeys<Schema, ConcreteTableName, NextAliasedAssociationName>,
            NextUsedNamespaces
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
      NextAliasedAssociationName,
      AllowedNextArgValues
    >
type AllowedNextArgValuesForLoad<
  DB,
  Schema,
  TableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  RequiredOnClauseKeysForThisAssociation,
> =
  | AssociationNamesForTable<Schema, TableName>
  | AssociationNamesForTable<Schema, TableName>[]
  | JoinAndStatements<DB, Schema, TableName, RequiredOnClauseKeysForThisAssociation>
type AllowedNextArgValuesForLeftJoinLoad<
  DB,
  Schema,
  TableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  RequiredOnClauseKeysForThisAssociation,
  UsedNamespaces,
> =
  | Exclude<AssociationNamesForTable<Schema, TableName>, UsedNamespaces>
  | Exclude<AssociationNamesForTable<Schema, TableName>, UsedNamespaces>[]
  | JoinAndStatements<DB, Schema, TableName, RequiredOnClauseKeysForThisAssociation>
type AllowedNextArgValuesForJoin<
  DB,
  Schema,
  TableName extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  RequiredOnClauseKeysForThisAssociation,
  UsedNamespaces,
> =
  | Exclude<AssociationNamesForTable<Schema, TableName>, UsedNamespaces>
  | JoinAndStatements<DB, Schema, TableName, RequiredOnClauseKeysForThisAssociation>

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
