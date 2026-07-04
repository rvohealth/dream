import Dream from '../Dream.js'
import { Camelized } from '../helpers/stringCasing.js'
import { AssociationTableNames } from './db.js'
import {
  AssociationNamesForAssociation,
  AssociationNamesForTable,
  AssociationTableName,
  AssociationTableNamesForAssociation,
  DreamAssociationNameToAssociatedModel,
  IsNonOptionalBelongsToAssociation,
  IsPolymorphicBelongsToAssociation,
  JoinAndStatements,
  MAX_VARIADIC_DEPTH,
  PolymorphicBelongsToAssociationNames,
  RequiredOnClauseKeys,
} from './dream.js'
import { Inc, ReadonlyTail } from './utils.js'

type VALID = 'valid'
type INVALID = 'invalid'
type INVALID_NON_TERMINAL_ARRAY = 'invalid_non_terminal_array'
type INVALID_NAMESPACE_REUSE = 'invalid_namespace_reuse'
type INVALID_POLYMORPHIC_BELONGS_TO_JOIN = 'invalid_polymorphic_belongs_to_join'
type INVALID_CONSTRAINT_ON_REQUIRED_BELONGS_TO = 'invalid_constraint_on_required_belongs_to'
type IS_ASSOCIATION_ALIAS = 'association_alias'
type IS_ASSOCIATION_NAME = 'association_name'
type IS_NOT_ASSOCIATION_NAME = 'not_association_name'
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
  // load/preload issue a separate query per association, so reusing an
  // association name or alias never causes a namespace collision, and no
  // namespaces are tracked.
  never,
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
  // joining a polymorphic BelongsTo raises CannotJoinPolymorphicBelongsToError
  // at runtime, so exclude those association names (and their aliased forms)
  PolymorphicBelongsToNames = PolymorphicBelongsToAssociationNames<Schema, ConcreteTableName>,
  AllowedNextArgValues =
    | Exclude<keyof SchemaAssociations & string, PolymorphicBelongsToNames>
    | Exclude<
        AliasedSchemaAssociation<Schema, ConcreteTableName>,
        `${PolymorphicBelongsToNames & string} as ${string}`
      >,
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
  // joining a polymorphic BelongsTo raises CannotJoinPolymorphicBelongsToError
  // at runtime, so exclude those association names (and their aliased forms)
  PolymorphicBelongsToNames = PolymorphicBelongsToAssociationNames<Schema, ConcreteTableName>,
  AllowedNextArgValues =
    | Exclude<keyof SchemaAssociations & string, PolymorphicBelongsToNames>
    | Exclude<
        AliasedSchemaAssociation<Schema, ConcreteTableName>,
        `${PolymorphicBelongsToNames & string} as ${string}`
      >,
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
  // The association names reachable at this position: when traversing through a
  // polymorphic association, the union of association names across all of the
  // polymorphic target tables (plus their aliased forms); otherwise, the
  // association names on the current table.
  AllowedNamesForNthArg = PreviousConcreteTableName extends keyof Schema
    ? AssociationNamesForAssociation<Schema, PreviousConcreteTableName, ConcreteAssociationName>
    : keyof SchemaAssociations & string,
  // The current arg with any ` as alias` suffix stripped, so aliased
  // associations resolve to the same metadata as their unaliased counterparts.
  UnaliasedNthArg = ConcreteArgs[0] extends `${infer AssociationName extends string} as ${string}`
    ? AssociationName
    : ConcreteArgs[0],
  // The namespace the current arg would claim: its alias when aliased,
  // otherwise the association name itself.
  NthArgumentNamespace = ConcreteArgs[0] extends `${string} as ${infer Alias extends string}`
    ? Alias
    : ConcreteArgs[0],
  NthArgument extends
    | VALID
    | INVALID
    | INVALID_NON_TERMINAL_ARRAY
    | INVALID_NAMESPACE_REUSE
    | INVALID_POLYMORPHIC_BELONGS_TO_JOIN
    | INVALID_CONSTRAINT_ON_REQUIRED_BELONGS_TO = ConcreteArgs['length'] extends 0
    ? VALID
    : ConcreteArgs[0] extends
          | (keyof SchemaAssociations & string)
          | AliasedSchemaAssociation<Schema, ConcreteTableName>
          | AllowedNamesForNthArg
      ? RecursionType extends 'load'
        ? VALID
        : NthArgumentNamespace extends UsedNamespaces
          ? INVALID_NAMESPACE_REUSE
          : IsPolymorphicBelongsToAssociation<Schema, ConcreteTableName, UnaliasedNthArg> extends true
            ? INVALID_POLYMORPHIC_BELONGS_TO_JOIN
            : VALID
      : ConcreteArgs[0] extends readonly unknown[]
        ? // the runtime only supports an array of association names as the final
          // argument (everything after a mid-chain array is silently dropped), so
          // arrays are only valid in the terminal position, which is validated
          // against AllowedNextArgValues rather than by this check
          INVALID_NON_TERMINAL_ARRAY
        : ConcreteArgs[0] extends JoinAndStatements<
              LastDream,
              DB,
              Schema,
              ConcreteTableName,
              RequiredOnClauseKeys<Schema, PreviousConcreteTableName, ConcreteAssociationName>
            >
          ? RecursionType extends 'join'
            ? VALID
            : IsNonOptionalBelongsToAssociation<
                  Schema,
                  PreviousConcreteTableName,
                  ConcreteAssociationName
                > extends true
              ? INVALID_CONSTRAINT_ON_REQUIRED_BELONGS_TO
              : VALID
          : INVALID,
> = NthArgument extends INVALID_NON_TERMINAL_ARRAY
  ? `an array of association names is only allowed as the final argument (argument ${Inc<Depth>})`
  : NthArgument extends INVALID_NAMESPACE_REUSE
    ? `association name or alias already used earlier in this chain (argument ${Inc<Depth>})`
    : NthArgument extends INVALID_POLYMORPHIC_BELONGS_TO_JOIN
      ? `cannot join a polymorphic BelongsTo association (argument ${Inc<Depth>})`
      : NthArgument extends INVALID_CONSTRAINT_ON_REQUIRED_BELONGS_TO
        ? `${CannotConstrainRequiredBelongsTo} (argument ${Inc<Depth>})`
        : NthArgument extends INVALID
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
  // The current arg with any ` as alias` suffix stripped, so aliased
  // associations resolve to the same metadata as their unaliased counterparts.
  UnaliasedNthArg = ConcreteArgs[0] extends `${infer AssociationName extends string} as ${string}`
    ? AssociationName
    : ConcreteArgs[0],
  // Union of all table names reachable via the previous polymorphic association.
  // When PreviousConcreteTableName is not a schema key (e.g. at depth 0), fall back to ConcreteTableName.
  PolymorphicTableNamesUnion = PreviousConcreteTableName extends keyof Schema
    ? AssociationTableNamesForAssociation<Schema, PreviousConcreteTableName, ConcreteAssociationName>
    : ConcreteTableName,
  // The specific table from the polymorphic union that owns the current arg as an association.
  // Used when the arg is not directly on ConcreteTableName (i.e. cross-polymorphic traversal).
  CrossPolymorphicTableForCurrentArg = UnaliasedNthArg extends string
    ? TableContainingAssociationInUnion<Schema, PolymorphicTableNamesUnion, UnaliasedNthArg>
    : never,
  // The effective table for looking up the current arg's association:
  // - ConcreteTableName when the arg is directly on it (normal case)
  // - CrossPolymorphicTableForCurrentArg when the arg is on a different table in the polymorphic union
  // Note: we use [T] extends [never] (non-distributive) to guard against CrossPolymorphicTableForCurrentArg
  // being `never`, because `never extends X` is vacuously true and would cause EffectiveConcreteTableName
  // to become `never` if we used a plain conditional.
  EffectiveConcreteTableName extends keyof Schema &
    AssociationTableNames<DB, Schema> &
    keyof DB = UnaliasedNthArg extends keyof SchemaAssociations & string
    ? ConcreteTableName
    : [CrossPolymorphicTableForCurrentArg] extends [never]
      ? ConcreteTableName
      : CrossPolymorphicTableForCurrentArg extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB
        ? CrossPolymorphicTableForCurrentArg
        : ConcreteTableName,
  // Schema associations on the effective table (may differ from SchemaAssociations when cross-polymorphic).
  EffectiveSchemaAssociations = Schema[EffectiveConcreteTableName]['associations' &
    keyof Schema[EffectiveConcreteTableName]],
  // True when the current arg names an association (aliased or not) on the
  // effective table. EffectiveConcreteTableName falls back to ConcreteTableName,
  // so this covers direct names, aliased names, cross-polymorphic names, and
  // aliased cross-polymorphic names with a single check.
  IsAssociationNameOrAlias extends boolean = UnaliasedNthArg extends keyof EffectiveSchemaAssociations &
    string
    ? true
    : false,
  //
  NextUnaliasedAssociationName = IsAssociationNameOrAlias extends true
    ? UnaliasedNthArg & keyof EffectiveSchemaAssociations & string
    : never,
  //
  // The namespace claimed by the current arg: its alias when aliased, otherwise
  // the association name itself. Non-association args leave the namespace of the
  // previously consumed association in place.
  NextAliasedAssociationName = IsAssociationNameOrAlias extends true
    ? ConcreteArgs[0] extends `${string} as ${infer AssociationAlias extends string}`
      ? AssociationAlias
      : NextUnaliasedAssociationName
    : ConcreteAssociationName,
  //
  NextPreviousConcreteTableName = IsAssociationNameOrAlias extends true
    ? EffectiveConcreteTableName
    : PreviousConcreteTableName,
  //
  // load/preload issue a separate query per association, so namespaces are not
  // tracked for the load recursion type
  NextUsedNamespaces = RecursionType extends 'load'
    ? never
    : IsAssociationNameOrAlias extends true
      ? UsedNamespaces | NextAliasedAssociationName
      : UsedNamespaces,
  //
  NextTableName extends keyof Schema &
    AssociationTableNames<DB, Schema> &
    keyof DB = IsAssociationNameOrAlias extends true
    ? AssociationTableName<Schema, EffectiveConcreteTableName, NextUnaliasedAssociationName>
    : ConcreteTableName,
  //
  AllowedAssociationNames = IsAssociationNameOrAlias extends true
    ? AssociationNamesForAssociation<Schema, EffectiveConcreteTableName, NextUnaliasedAssociationName>
    : PreviousConcreteTableName extends keyof Schema
      ? AssociationNamesForAssociation<Schema, PreviousConcreteTableName, ConcreteAssociationName>
      : AssociationNamesForTable<Schema, ConcreteTableName>, // fall back to association names for table for root only
  //
  CurrentRequiredOnClauseKeys = IsAssociationNameOrAlias extends true
    ? RequiredOnClauseKeys<Schema, EffectiveConcreteTableName, NextUnaliasedAssociationName>
    : RequiredOnClauseKeys<Schema, PreviousConcreteTableName, ConcreteAssociationName>,
  //
  // True when the just-consumed association is a non-optional (required)
  // BelongsTo. The hydrating load variants forbid a trailing constraint on such
  // an association, because the constraint could filter out the parent and null
  // a value the generated OpenAPI spec declares non-nullable.
  CurrentAssociationIsNonOptionalBelongsTo = IsAssociationNameOrAlias extends true
    ? IsNonOptionalBelongsToAssociation<Schema, EffectiveConcreteTableName, NextUnaliasedAssociationName>
    : IsNonOptionalBelongsToAssociation<Schema, PreviousConcreteTableName, ConcreteAssociationName>,
  //
  // The Dream model reached after consuming the current arg. Distributes over
  // LastDream so that traversing through a polymorphic association resolves to
  // the specific polymorphic target that owns the association, and uses the
  // unaliased association name so that aliased traversal advances the model the
  // same way unaliased traversal does. Falls back to LastDream for
  // non-association args (e.g. and-clauses), which do not advance the chain.
  NextDreamCandidate = IsAssociationNameOrAlias extends true
    ? LastDream extends Dream
      ? NextUnaliasedAssociationName extends keyof LastDream
        ? DreamAssociationNameToAssociatedModel<LastDream, NextUnaliasedAssociationName & keyof LastDream>
        : never
      : never
    : LastDream,
  NextDream extends Dream = [NextDreamCandidate] extends [never]
    ? LastDream
    : NextDreamCandidate extends Dream
      ? NextDreamCandidate
      : LastDream,
  //
  // The join recursion types exclude polymorphic BelongsTo association names
  // (and their aliased forms), since joining a polymorphic BelongsTo raises
  // CannotJoinPolymorphicBelongsToError at runtime.
  NextPolymorphicBelongsToNames = RecursionType extends 'load'
    ? never
    : PolymorphicBelongsToAssociationNames<Schema, NextTableName>,
  JoinSafeAllowedAssociationNames = Exclude<
    AllowedAssociationNames,
    NextPolymorphicBelongsToNames | `${NextPolymorphicBelongsToNames & string} as ${string}`
  >,
  //
  AllowedNextArgValues = RecursionType extends 'load'
    ? AllowedNextArgValuesForLoad<
        NextDream,
        DB,
        Schema,
        AllowedAssociationNames,
        NextTableName,
        CurrentRequiredOnClauseKeys,
        CurrentAssociationIsNonOptionalBelongsTo
      >
    : RecursionType extends 'leftJoinLoad'
      ? AllowedNextArgValuesForLeftJoinLoad<
          NextDream,
          DB,
          Schema,
          JoinSafeAllowedAssociationNames,
          NextTableName,
          CurrentRequiredOnClauseKeys,
          NextUsedNamespaces,
          CurrentAssociationIsNonOptionalBelongsTo
        >
      : RecursionType extends 'join'
        ? AllowedNextArgValuesForJoin<
            NextDream,
            DB,
            Schema,
            JoinSafeAllowedAssociationNames,
            NextTableName,
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
      // the real (unaliased) association name: downstream lookups
      // (RequiredOnClauseKeys, IsNonOptionalBelongsToAssociation,
      // AssociationNamesForAssociation) index schema metadata by real name,
      // and an alias would silently collapse them to null
      [NextUnaliasedAssociationName] extends [never] ? ConcreteAssociationName : NextUnaliasedAssociationName,
      AllowedNextArgValues,
      NextDream
    >

/**
 * Error string surfaced when a trailing load-time constraint is applied to a
 * non-optional BelongsTo association in a hydrating load variant.
 */
type CannotConstrainRequiredBelongsTo =
  'cannot apply a constraint to a required (non-optional) BelongsTo association'

type AllowedNextArgValuesForLoad<
  I extends Dream,
  DB,
  Schema,
  AllowedNames,
  TableForJoin extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  RequiredOnClauseKeysForThisAssociation,
  IsNonOptionalBelongsTo,
> =
  | AllowedNames
  | AllowedNames[]
  | (IsNonOptionalBelongsTo extends true
      ? CannotConstrainRequiredBelongsTo
      : JoinAndStatements<I, DB, Schema, TableForJoin, RequiredOnClauseKeysForThisAssociation>)

type AllowedNextArgValuesForLeftJoinLoad<
  I extends Dream,
  DB,
  Schema,
  AllowedNames,
  TableForJoin extends keyof Schema & AssociationTableNames<DB, Schema> & keyof DB,
  RequiredOnClauseKeysForThisAssociation,
  UsedNamespaces,
  IsNonOptionalBelongsTo,
> =
  | Exclude<AllowedNames, UsedNamespaces>
  | Exclude<AllowedNames, UsedNamespaces>[]
  | (IsNonOptionalBelongsTo extends true
      ? CannotConstrainRequiredBelongsTo
      : JoinAndStatements<I, DB, Schema, TableForJoin, RequiredOnClauseKeysForThisAssociation>)

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
