import CalendarDate from '../../src/helpers/CalendarDate'
import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

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

export type Json = ColumnType<JsonValue, string | JsonValue, string | JsonValue>;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
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

export type Species = "cat" | "dog" | "frog";
export const SpeciesValues = [
  "cat",
  "dog",
  "frog"
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
  multicolor: BalloonColorsEnum[] | null;
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
  hidden: Generated<boolean | null>;
  id: Generated<Int8>;
  lost: boolean | null;
  petId: Int8;
  position: number;
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

export interface Pets {
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  favoriteDaysOfWeek: number[] | null;
  favoriteTreats: CatTreats[] | null;
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

export interface Users {
  birthdate: Timestamp | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  email: string;
  favoriteDates: Timestamp[] | null;
  favoriteDatetimes: Timestamp[] | null;
  favoriteNumbers: number[] | null;
  favoriteWord: string | null;
  featuredPostPosition: number | null;
  id: Generated<Int8>;
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
  localized_texts: LocalizedTexts;
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
  localized_texts: LocalizedTexts
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
  user_settings: UserSettings
  users: Users
}
