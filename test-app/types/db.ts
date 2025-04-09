
/*

                                    ,▄█▄                 
    ]█▄▄                         ╓█████▌                 
    ▐██████▄                   ▄█████▓╣█                 
     ║████████▄,  ,  ,,▄,▄▄▄▓██████╬╬╣╣▌                 
      ╚███╣██████████▓▓▓▓██████████╩╠╬▓                  
       ╙█╬╬╬▓███████████████████████▒▓▌                  
        ╙▓█▓██████████████████████████                   
         ╚██████▀███████████╩█▓▌▐▓████▄                  
         '║█████`╣█Γ║████████▄▄φ▓█████▌                 
          ║█████████████████████▓█████▌                  
           █████████████▓▓████████████                   
           ║█████████████████████████                    
          ]█████████████████████████                     
         ,▓██████████████████████████                    
        ▓█████████████████████████████µ                  
       ▐███████████████████████████████▄▄                
       ║█████████████████████████████████╬╬╣▓            
   ,╔╦║███████████████████████████████████▓╬╬╣           
,≥≥⌠░░░╠▓████████████████████████████████████▓▓          
,;=-',▄█████████████████████████████████████████▓        
                                                         
                                                         
                                                         
  ██████╗ ███████╗██╗   ██╗ ██████╗██╗  ██╗██╗ ██████╗   
  ██╔══██╗██╔════╝╚██╗ ██╔╝██╔════╝██║  ██║██║██╔════╝   
  ██████╔╝███████╗ ╚████╔╝ ██║     ███████║██║██║        
  ██╔═══╝ ╚════██║  ╚██╔╝  ██║     ██╔══██║██║██║        
  ██║     ███████║   ██║   ╚██████╗██║  ██║██║╚██████╗   
  ╚═╝     ╚══════╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝ ╚═════╝   
                                                         
                                                         

This file was automatically generated by my cat, Aster.
He does not want you mucking about with his files,
and we are pretty lax on trimming his nails.

I mean, we have him pretty well fenced in but he is an
escape artist and he still manages to get fleas!

My point is, don't go mucking about with his files!

He actually has a hopefully well-tempered message for
us humans, he says:

"
  Dear pathetic humans,

  Here is a haiku to keep you in line

  don't dare go mucking
  with my files, I lyke them fine
  prettierignore
"

*/
import type CalendarDate from '../../src/helpers/CalendarDate.js'
import { type DateTime } from '../../src/helpers/DateTime.js'
/**
 * This file was generated by kysely-codegen.
 * Please do not edit it manually.
 */

import type { ColumnType } from "kysely";

export type ArrayType<T> = ArrayTypeImpl<T> extends (infer U)[]
  ? U[]
  : ArrayTypeImpl<T>;

export type ArrayTypeImpl<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S[], I[], U[]>
  : T[];

export type BalloonColorsEnum = "blue" | "green" | "red";
export const BalloonColorsEnumValues = [
  "blue",
  "green",
  "red"
] as const


export type BalloonLineMaterialsEnum = "nylon" | "ribbon" | "twine" | "yarn";
export const BalloonLineMaterialsEnumValues = [
  "nylon",
  "ribbon",
  "twine",
  "yarn"
] as const


export type BalloonTypesEnum = "Animal" | "Latex" | "Mylar";
export const BalloonTypesEnumValues = [
  "Animal",
  "Latex",
  "Mylar"
] as const


export type CatTreats = "cat-safe chalupas (catlupas,supaloopas)" | "chicken" | "ocean fish" | "tuna";
export const CatTreatsValues = [
  "cat-safe chalupas (catlupas,supaloopas)",
  "chicken",
  "ocean fish",
  "tuna"
] as const


export type ExtraRateableTypesEnum = "Balloon" | "Composition" | "Post";
export const ExtraRateableTypesEnumValues = [
  "Balloon",
  "Composition",
  "Post"
] as const


export type ExtraRatingTypesEnum = "HeartRating" | "StarRating";
export const ExtraRatingTypesEnumValues = [
  "HeartRating",
  "StarRating"
] as const


export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type LocalesEnum = "de-DE" | "en-AU" | "en-BZ" | "en-CA" | "en-cb" | "en-GB" | "en-IE" | "en-IN" | "en-JM" | "en-MT" | "en-MY" | "en-NZ" | "en-PH" | "en-SG" | "en-TT" | "en-US" | "en-ZA" | "en-ZW" | "es-ES" | "fr-FR" | "it-IT" | "ja-JP" | "ko-KR" | "pt-BR" | "zh-CN" | "zh-TW";
export const LocalesEnumValues = [
  "de-DE",
  "en-AU",
  "en-BZ",
  "en-CA",
  "en-cb",
  "en-GB",
  "en-IE",
  "en-IN",
  "en-JM",
  "en-MT",
  "en-MY",
  "en-NZ",
  "en-PH",
  "en-SG",
  "en-TT",
  "en-US",
  "en-ZA",
  "en-ZW",
  "es-ES",
  "fr-FR",
  "it-IT",
  "ja-JP",
  "ko-KR",
  "pt-BR",
  "zh-CN",
  "zh-TW"
] as const


export type LocalizableTypesEnum = "Composition" | "CompositionAsset";
export const LocalizableTypesEnumValues = [
  "Composition",
  "CompositionAsset"
] as const


export type Numeric = ColumnType<string, number | string, number | string>;

export type PetTreatsEnum = "efishy feesh" | "snick snowcks";
export const PetTreatsEnumValues = [
  "efishy feesh",
  "snick snowcks"
] as const


export type Species = "cat" | "dog" | "frog";
export const SpeciesValues = [
  "cat",
  "dog",
  "frog"
] as const


export type SpeciesTypesEnum = "cat" | "noncat";
export const SpeciesTypesEnumValues = [
  "cat",
  "noncat"
] as const

export type IdType = string | number | bigint
export type Timestamp = ColumnType<DateTime | CalendarDate>

export interface BalloonLines {
  balloonId: Int8;
  createdAt: Timestamp;
  id: Generated<Int8>;
  material: BalloonLineMaterialsEnum | null;
  updatedAt: Timestamp;
}

export interface BalloonSpotterBalloons {
  balloonId: Int8;
  balloonSpotterId: Int8;
  createdAt: Timestamp;
  id: Generated<Int8>;
  updatedAt: Timestamp;
  userId: Int8 | null;
}

export interface BalloonSpotters {
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
  updatedAt: Timestamp;
}

export interface BeautifulBalloons {
  color: BalloonColorsEnum | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  id: Generated<Int8>;
  multicolor: ArrayType<BalloonColorsEnum> | null;
  positionAlpha: number | null;
  positionBeta: number | null;
  type: BalloonTypesEnum;
  updatedAt: Timestamp;
  userId: Int8 | null;
  volume: Numeric | null;
}

export interface Collars {
  balloonId: Int8 | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  hidden: Generated<boolean | null>;
  id: Generated<Int8>;
  lost: boolean | null;
  petId: Int8 | null;
  position: number | null;
  tagName: string | null;
  updatedAt: Timestamp;
}

export interface CompositionAssetAudits {
  approval: boolean | null;
  compositionAssetId: Int8;
  createdAt: Timestamp;
  id: Generated<Int8>;
  notes: string | null;
  updatedAt: Timestamp;
}

export interface CompositionAssets {
  compositionId: Int8;
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
  primary: Generated<boolean | null>;
  score: Generated<number | null>;
  src: string | null;
  updatedAt: Timestamp;
}

export interface Compositions {
  content: string | null;
  createdAt: Timestamp;
  id: Generated<Int8>;
  metadata2: Json | null;
  metadata3: Json | null;
  metadata: Generated<Json>;
  primary: Generated<boolean | null>;
  updatedAt: Timestamp;
  userId: Int8;
}

export interface EdgeCaseAttributes {
  createdAt: Timestamp;
  id: Generated<Int8>;
  kPop: boolean | null;
  popK: string | null;
  popKPop: number | null;
  updatedAt: Timestamp;
}

export interface ExtraRatings {
  body: string | null;
  createdAt: Timestamp;
  extraRateableId: Int8;
  extraRateableType: ExtraRateableTypesEnum;
  id: Generated<Int8>;
  rating: number | null;
  type: ExtraRatingTypesEnum;
  updatedAt: Timestamp;
  userId: Int8;
}

export interface GraphEdgeNodes {
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  edgeId: Int8;
  id: Generated<Int8>;
  multiScopedPosition: number;
  nodeId: Int8;
  position: number;
  updatedAt: Timestamp;
}

export interface GraphEdges {
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
  updatedAt: Timestamp;
  weight: Numeric | null;
}

export interface GraphNodes {
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
  omittedEdgePosition: number | null;
  updatedAt: Timestamp;
}

export interface IncompatibleForeignKeyTypeExamples {
  createdAt: Timestamp;
  id: Generated<Int8>;
  updatedAt: Timestamp;
  userId: number;
}

export interface InvalidAssociationSortableModels {
  createdAt: Timestamp;
  id: Generated<Int8>;
  position: number | null;
  updatedAt: Timestamp;
}

export interface InvalidScopeSortableModels {
  createdAt: Timestamp;
  id: Generated<Int8>;
  position: number | null;
  updatedAt: Timestamp;
}

export interface LocalizedTexts {
  body: string | null;
  createdAt: Timestamp;
  id: Generated<Int8>;
  locale: LocalesEnum;
  localizableId: Int8;
  localizableType: LocalizableTypesEnum;
  name: string | null;
  title: string | null;
  updatedAt: Timestamp;
}

export interface ModelForOpenapiTypeSpecs {
  bio: Generated<string>;
  birthdate: Timestamp | null;
  collarCount: Int8 | null;
  collarCountInt: number | null;
  collarCountNumeric: Numeric | null;
  createdAt: Generated<Timestamp>;
  createdOn: Generated<Timestamp>;
  email: string;
  favoriteBigint: Int8 | null;
  favoriteBigints: ArrayType<Int8> | null;
  favoriteBooleans: boolean[] | null;
  favoriteCitext: string | null;
  favoriteCitexts: string[] | null;
  favoriteDates: ArrayType<Timestamp> | null;
  favoriteDatetimes: ArrayType<Timestamp> | null;
  favoriteIntegers: number[] | null;
  favoriteJsonbs: ArrayType<Json> | null;
  favoriteJsons: ArrayType<Json> | null;
  favoriteNumerics: ArrayType<Numeric> | null;
  favoriteTexts: string[] | null;
  favoriteTreats: ArrayType<PetTreatsEnum> | null;
  favoriteUuids: string[] | null;
  id: Generated<Int8>;
  jsonData: Json | null;
  jsonbData: Json | null;
  likesTreats: Generated<boolean>;
  likesWalks: boolean | null;
  name: string | null;
  nicknames: string[] | null;
  notes: string | null;
  optionalUuid: Generated<string | null>;
  passwordDigest: string;
  requiredCollarCount: Generated<Int8>;
  requiredCollarCountInt: Generated<number>;
  requiredFavoriteBigint: Generated<Int8>;
  requiredFavoriteBigints: Generated<ArrayType<Int8>>;
  requiredFavoriteBooleans: Generated<boolean[]>;
  requiredFavoriteCitext: Generated<string>;
  requiredFavoriteCitexts: Generated<string[]>;
  requiredFavoriteDates: Generated<ArrayType<Timestamp>>;
  requiredFavoriteDatetimes: Generated<ArrayType<Timestamp>>;
  requiredFavoriteIntegers: Generated<number[]>;
  requiredFavoriteJsonbs: Generated<ArrayType<Json>>;
  requiredFavoriteJsons: Generated<ArrayType<Json>>;
  requiredFavoriteNumerics: Generated<ArrayType<Numeric>>;
  requiredFavoriteTexts: Generated<string[]>;
  requiredFavoriteUuids: Generated<string[]>;
  requiredJsonData: Generated<Json>;
  requiredJsonbData: Generated<Json>;
  requiredNicknames: Generated<string[]>;
  species: SpeciesTypesEnum | null;
  updatedAt: Generated<Timestamp>;
  uuid: Generated<string>;
  volume: Numeric | null;
}

export interface ModelWithDateTimeConditionalHooks {
  counter: Generated<number>;
  createdAt: Timestamp;
  id: Generated<Int8>;
  somethingHappenedAt: Timestamp | null;
  somethingHappenedInATransactionAt: Timestamp | null;
  updatedAt: Timestamp;
}

export interface ModelWithoutCustomDeletedAts {
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  id: Generated<Int8>;
  updatedAt: Timestamp;
}

export interface ModelWithoutDeletedAts {
  createdAt: Timestamp;
  id: Generated<Int8>;
  updatedAt: Timestamp;
}

export interface ModelWithoutUpdatedAt {
  cantUpdateThis: string | null;
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
}

export interface ModelWithParamSafeAndUnsafeColumns {
  allowedColumn1: string | null;
  allowedColumn2: string | null;
  column1: string | null;
  column2: string | null;
  createdAt: Timestamp;
  disallowedColumn1: string | null;
  disallowedColumn2: string | null;
  id: Generated<Int8>;
  updatedAt: Timestamp;
}

export interface ModelWithParamUnsafeColumns {
  allowedColumn1: string | null;
  allowedColumn2: string | null;
  createdAt: Timestamp;
  disallowedColumn1: string | null;
  disallowedColumn2: string | null;
  id: Generated<Int8>;
  updatedAt: Timestamp;
}

export interface ModelWithSerialPrimaryKeys {
  createdAt: Timestamp;
  id: Generated<number>;
  updatedAt: Timestamp;
}

export interface Pets {
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  favoriteDaysOfWeek: number[] | null;
  favoriteTreats: ArrayType<CatTreats> | null;
  id: Generated<Int8>;
  name: string | null;
  nickname: string | null;
  positionWithinSpecies: number | null;
  species: Species | null;
  userId: Int8 | null;
  userUuid: string | null;
}

export interface PetUnderstudyJoinModels {
  createdAt: Timestamp;
  id: Generated<Int8>;
  petId: Int8;
  understudyId: Int8;
  updatedAt: Timestamp;
}

export interface PostComments {
  body: string | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  id: Generated<Int8>;
  postId: Int8;
  updatedAt: Timestamp;
}

export interface Posts {
  body: string | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  id: Generated<Int8>;
  position: number | null;
  postVisibilityId: Int8 | null;
  updatedAt: Timestamp;
  userId: Int8;
}

export interface PostVisibilities {
  createdAt: Timestamp;
  id: Generated<Int8>;
  notes: string | null;
  updatedAt: Timestamp;
  visibility: boolean | null;
}

export interface Ratings {
  body: string | null;
  createdAt: Timestamp;
  id: Generated<Int8>;
  rateableId: Int8;
  rateableType: string;
  rating: number | null;
  updatedAt: Timestamp;
  userId: Int8;
}

export interface Sandbags {
  balloonId: Int8;
  createdAt: Timestamp;
  id: Generated<Int8>;
  updatedAt: Timestamp;
  weight: number | null;
  weightKgs: number | null;
  weightTons: number | null;
}

export interface UnscopedSortableModels {
  createdAt: Timestamp;
  id: Generated<Int8>;
  position: number | null;
  updatedAt: Timestamp;
}

export interface Users {
  birthdate: Timestamp | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  email: string;
  encryptedSecret: string | null;
  favoriteDates: ArrayType<Timestamp> | null;
  favoriteDatetimes: ArrayType<Timestamp> | null;
  favoriteNumbers: number[] | null;
  favoriteWord: string | null;
  featuredPostPosition: number | null;
  grams: number | null;
  id: Generated<Int8>;
  myOtherEncryptedSecret: string | null;
  name: string | null;
  passwordDigest: string;
  socialSecurityNumber: string | null;
  targetRating: number | null;
  updatedAt: Timestamp;
  uuid: Generated<string>;
}

export interface UserSettings {
  createdAt: Timestamp;
  id: Generated<Int8>;
  likesChalupas: Generated<boolean>;
  updatedAt: Timestamp;
  userId: Int8;
}

export interface DB {
  balloon_lines: BalloonLines;
  balloon_spotter_balloons: BalloonSpotterBalloons;
  balloon_spotters: BalloonSpotters;
  beautiful_balloons: BeautifulBalloons;
  collars: Collars;
  composition_asset_audits: CompositionAssetAudits;
  composition_assets: CompositionAssets;
  compositions: Compositions;
  edge_case_attributes: EdgeCaseAttributes;
  extra_ratings: ExtraRatings;
  graph_edge_nodes: GraphEdgeNodes;
  graph_edges: GraphEdges;
  graph_nodes: GraphNodes;
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExamples;
  invalid_association_sortable_models: InvalidAssociationSortableModels;
  invalid_scope_sortable_models: InvalidScopeSortableModels;
  localized_texts: LocalizedTexts;
  model_for_openapi_type_specs: ModelForOpenapiTypeSpecs;
  model_with_date_time_conditional_hooks: ModelWithDateTimeConditionalHooks;
  model_with_param_safe_and_unsafe_columns: ModelWithParamSafeAndUnsafeColumns;
  model_with_param_unsafe_columns: ModelWithParamUnsafeColumns;
  model_with_serial_primary_keys: ModelWithSerialPrimaryKeys;
  model_without_custom_deleted_ats: ModelWithoutCustomDeletedAts;
  model_without_deleted_ats: ModelWithoutDeletedAts;
  model_without_updated_at: ModelWithoutUpdatedAt;
  pet_understudy_join_models: PetUnderstudyJoinModels;
  pets: Pets;
  post_comments: PostComments;
  post_visibilities: PostVisibilities;
  posts: Posts;
  ratings: Ratings;
  sandbags: Sandbags;
  unscoped_sortable_models: UnscopedSortableModels;
  user_settings: UserSettings;
  users: Users;
}


export class DBClass {
  balloon_lines: BalloonLines
  balloon_spotter_balloons: BalloonSpotterBalloons
  balloon_spotters: BalloonSpotters
  beautiful_balloons: BeautifulBalloons
  collars: Collars
  composition_asset_audits: CompositionAssetAudits
  composition_assets: CompositionAssets
  compositions: Compositions
  edge_case_attributes: EdgeCaseAttributes
  extra_ratings: ExtraRatings
  graph_edge_nodes: GraphEdgeNodes
  graph_edges: GraphEdges
  graph_nodes: GraphNodes
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExamples
  invalid_association_sortable_models: InvalidAssociationSortableModels
  invalid_scope_sortable_models: InvalidScopeSortableModels
  localized_texts: LocalizedTexts
  model_for_openapi_type_specs: ModelForOpenapiTypeSpecs
  model_with_date_time_conditional_hooks: ModelWithDateTimeConditionalHooks
  model_with_param_safe_and_unsafe_columns: ModelWithParamSafeAndUnsafeColumns
  model_with_param_unsafe_columns: ModelWithParamUnsafeColumns
  model_with_serial_primary_keys: ModelWithSerialPrimaryKeys
  model_without_custom_deleted_ats: ModelWithoutCustomDeletedAts
  model_without_deleted_ats: ModelWithoutDeletedAts
  model_without_updated_at: ModelWithoutUpdatedAt
  pet_understudy_join_models: PetUnderstudyJoinModels
  pets: Pets
  post_comments: PostComments
  post_visibilities: PostVisibilities
  posts: Posts
  ratings: Ratings
  sandbags: Sandbags
  unscoped_sortable_models: UnscopedSortableModels
  user_settings: UserSettings
  users: Users
}
