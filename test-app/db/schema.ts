import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type BalloonColorsEnum = "blue" | "green" | "red";

export type BalloonLineMaterialsEnum = "nylon" | "ribbon" | "twine" | "yarn";

export type BalloonTypesEnum = "Animal" | "Latex" | "Mylar";

export type CatTreats = "cat-safe chalupas (catlupas,supaloopas)" | "chicken" | "ocean fish" | "tuna";

export type ExtraRateableTypesEnum = "Balloon" | "Composition" | "Post";

export type ExtraRatingTypesEnum = "HeartRating" | "StarRating";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, string | number | bigint, string | number | bigint>;

export type LocalesEnum = "de-DE" | "en-AU" | "en-BZ" | "en-CA" | "en-cb" | "en-GB" | "en-IE" | "en-IN" | "en-JM" | "en-MT" | "en-MY" | "en-NZ" | "en-PH" | "en-SG" | "en-TT" | "en-US" | "en-ZA" | "en-ZW" | "es-ES" | "fr-FR" | "it-IT" | "ja-JP" | "ko-KR" | "pt-BR" | "zh-CN" | "zh-TW";

export type LocalizableTypesEnum = "Composition" | "CompositionAsset";

export type Numeric = ColumnType<string, string | number, string | number>;

export type Species = "cat" | "dog" | "frog";
type IdType = string | number | bigint | undefined
type Timestamp = ColumnType<DateTime>

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
  id: Generated<Int8>;
  lost: boolean | null;
  petId: Int8;
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
  nodeId: Int8;
  position: number | null;
  updatedAt: Timestamp;
}

export interface GraphEdges {
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
  updatedAt: Timestamp;
}

export interface GraphNodes {
  createdAt: Timestamp;
  id: Generated<Int8>;
  name: string | null;
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

export interface Pets {
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  favoriteTreats: CatTreats[] | null;
  id: Generated<Int8>;
  name: string | null;
  species: Species | null;
  userId: Int8 | null;
}

export interface PetUnderstudyJoinModels {
  createdAt: Timestamp;
  id: Generated<Int8>;
  petId: Int8;
  understudyId: Int8;
  updatedAt: Timestamp;
}

export interface Posts {
  body: string | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  id: Generated<Int8>;
  position: number;
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
}

export interface Users {
  birthdate: Timestamp | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  email: string;
  featuredPostPosition: number | null;
  id: Generated<Int8>;
  name: string | null;
  passwordDigest: string;
  targetRating: number | null;
  updatedAt: Timestamp;
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
  pet_understudy_join_models: PetUnderstudyJoinModels;
  pets: Pets;
  post_visibilities: PostVisibilities;
  posts: Posts;
  ratings: Ratings;
  sandbags: Sandbags;
  user_settings: UserSettings;
  users: Users;
}


export const BalloonLineColumns = ['balloonId', 'createdAt', 'id', 'material', 'updatedAt'] as const
export const BalloonSpotterBalloonColumns = ['balloonId', 'balloonSpotterId', 'createdAt', 'id', 'updatedAt', 'userId'] as const
export const BalloonSpotterColumns = ['createdAt', 'id', 'name', 'updatedAt'] as const
export const BeautifulBalloonColumns = ['color', 'createdAt', 'deletedAt', 'id', 'multicolor', 'positionAlpha', 'positionBeta', 'type', 'updatedAt', 'userId', 'volume'] as const
export const CollarColumns = ['balloonId', 'createdAt', 'id', 'lost', 'petId', 'tagName', 'updatedAt'] as const
export const CompositionAssetAuditColumns = ['approval', 'compositionAssetId', 'createdAt', 'id', 'notes', 'updatedAt'] as const
export const CompositionAssetColumns = ['compositionId', 'createdAt', 'id', 'name', 'primary', 'score', 'src', 'updatedAt'] as const
export const CompositionColumns = ['content', 'createdAt', 'id', 'primary', 'updatedAt', 'userId'] as const
export const EdgeCaseAttributeColumns = ['createdAt', 'id', 'kPop', 'popK', 'popKPop', 'updatedAt'] as const
export const ExtraRatingColumns = ['body', 'createdAt', 'extraRateableId', 'extraRateableType', 'id', 'rating', 'type', 'updatedAt', 'userId'] as const
export const GraphEdgeNodeColumns = ['createdAt', 'edgeId', 'id', 'nodeId', 'position', 'updatedAt'] as const
export const GraphEdgeColumns = ['createdAt', 'id', 'name', 'updatedAt'] as const
export const GraphNodeColumns = ['createdAt', 'id', 'name', 'updatedAt'] as const
export const IncompatibleForeignKeyTypeExampleColumns = ['createdAt', 'id', 'updatedAt', 'userId'] as const
export const LocalizedTextColumns = ['body', 'createdAt', 'id', 'locale', 'localizableId', 'localizableType', 'name', 'title', 'updatedAt'] as const
export const PetColumns = ['createdAt', 'deletedAt', 'favoriteTreats', 'id', 'name', 'species', 'userId'] as const
export const PetUnderstudyJoinModelColumns = ['createdAt', 'id', 'petId', 'understudyId', 'updatedAt'] as const
export const PostColumns = ['body', 'createdAt', 'deletedAt', 'id', 'position', 'postVisibilityId', 'updatedAt', 'userId'] as const
export const PostVisibilityColumns = ['createdAt', 'id', 'notes', 'updatedAt', 'visibility'] as const
export const RatingColumns = ['body', 'createdAt', 'id', 'rateableId', 'rateableType', 'rating', 'updatedAt', 'userId'] as const
export const SandbagColumns = ['balloonId', 'createdAt', 'id', 'updatedAt', 'weight'] as const
export const UserColumns = ['birthdate', 'createdAt', 'deletedAt', 'email', 'featuredPostPosition', 'id', 'name', 'passwordDigest', 'targetRating', 'updatedAt'] as const
export const UserSettingColumns = ['createdAt', 'id', 'likesChalupas', 'updatedAt', 'userId'] as const

export interface BalloonLineAttributes {
  balloonId: IdType
  createdAt: DateTime
  id: IdType
  material: BalloonLineMaterialsEnum | null
  updatedAt: DateTime
}  

export interface BalloonSpotterBalloonAttributes {
  balloonId: IdType
  balloonSpotterId: IdType
  createdAt: DateTime
  id: IdType
  updatedAt: DateTime
  userId: IdType | null
}  

export interface BalloonSpotterAttributes {
  createdAt: DateTime
  id: IdType
  name: string | null
  updatedAt: DateTime
}  

export interface BeautifulBalloonAttributes {
  color: BalloonColorsEnum | null
  createdAt: DateTime
  deletedAt: DateTime | null
  id: IdType
  multicolor: BalloonColorsEnum[] | null
  positionAlpha: number | null
  positionBeta: number | null
  type: BalloonTypesEnum
  updatedAt: DateTime
  userId: IdType | null
  volume: number | null
}  

export interface CollarAttributes {
  balloonId: IdType | null
  createdAt: DateTime
  id: IdType
  lost: boolean | null
  petId: IdType
  tagName: string | null
  updatedAt: DateTime
}  

export interface CompositionAssetAuditAttributes {
  approval: boolean | null
  compositionAssetId: IdType
  createdAt: DateTime
  id: IdType
  notes: string | null
  updatedAt: DateTime
}  

export interface CompositionAssetAttributes {
  compositionId: IdType
  createdAt: DateTime
  id: IdType
  name: string | null
  primary: boolean | null
  score: number | null
  src: string | null
  updatedAt: DateTime
}  

export interface CompositionAttributes {
  content: string | null
  createdAt: DateTime
  id: IdType
  primary: boolean | null
  updatedAt: DateTime
  userId: IdType
}  

export interface EdgeCaseAttributeAttributes {
  createdAt: DateTime
  id: IdType
  kPop: boolean | null
  popK: string | null
  popKPop: number | null
  updatedAt: DateTime
}  

export interface ExtraRatingAttributes {
  body: string | null
  createdAt: DateTime
  extraRateableId: IdType
  extraRateableType: ExtraRateableTypesEnum
  id: IdType
  rating: number | null
  type: ExtraRatingTypesEnum
  updatedAt: DateTime
  userId: IdType
}  

export interface GraphEdgeNodeAttributes {
  createdAt: DateTime
  edgeId: IdType
  id: IdType
  nodeId: IdType
  position: number | null
  updatedAt: DateTime
}  

export interface GraphEdgeAttributes {
  createdAt: DateTime
  id: IdType
  name: string | null
  updatedAt: DateTime
}  

export interface GraphNodeAttributes {
  createdAt: DateTime
  id: IdType
  name: string | null
  updatedAt: DateTime
}  

export interface IncompatibleForeignKeyTypeExampleAttributes {
  createdAt: DateTime
  id: IdType
  updatedAt: DateTime
  userId: number
}  

export interface LocalizedTextAttributes {
  body: string | null
  createdAt: DateTime
  id: IdType
  locale: LocalesEnum
  localizableId: IdType
  localizableType: LocalizableTypesEnum
  name: string | null
  title: string | null
  updatedAt: DateTime
}  

export interface PetAttributes {
  createdAt: DateTime
  deletedAt: DateTime | null
  favoriteTreats: CatTreats[] | null
  id: IdType
  name: string | null
  species: Species | null
  userId: IdType | null
}  

export interface PetUnderstudyJoinModelAttributes {
  createdAt: DateTime
  id: IdType
  petId: IdType
  understudyId: IdType
  updatedAt: DateTime
}  

export interface PostAttributes {
  body: string | null
  createdAt: DateTime
  deletedAt: DateTime | null
  id: IdType
  position: number
  postVisibilityId: IdType | null
  updatedAt: DateTime
  userId: IdType
}  

export interface PostVisibilityAttributes {
  createdAt: DateTime
  id: IdType
  notes: string | null
  updatedAt: DateTime
  visibility: boolean | null
}  

export interface RatingAttributes {
  body: string | null
  createdAt: DateTime
  id: IdType
  rateableId: IdType
  rateableType: string
  rating: number | null
  updatedAt: DateTime
  userId: IdType
}  

export interface SandbagAttributes {
  balloonId: IdType
  createdAt: DateTime
  id: IdType
  updatedAt: DateTime
  weight: number | null
}  

export interface UserAttributes {
  birthdate: DateTime | null
  createdAt: DateTime
  deletedAt: DateTime | null
  email: string
  featuredPostPosition: number | null
  id: IdType
  name: string | null
  passwordDigest: string
  targetRating: number | null
  updatedAt: DateTime
}  

export interface UserSettingAttributes {
  createdAt: DateTime
  id: IdType
  likesChalupas: boolean
  updatedAt: DateTime
  userId: IdType
}  


export const BalloonLinesDBTypeMap = {
  balloonId: 'bigint',
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  material: 'balloon_line_materials_enum',
  updatedAt: 'timestamp without time zone'
}

export const BalloonSpotterBalloonsDBTypeMap = {
  balloonId: 'bigint',
  balloonSpotterId: 'bigint',
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  updatedAt: 'timestamp without time zone',
  userId: 'bigint'
}

export const BalloonSpottersDBTypeMap = {
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  name: 'character varying',
  updatedAt: 'timestamp without time zone'
}

export const BeautifulBalloonsDBTypeMap = {
  color: 'balloon_colors_enum',
  createdAt: 'timestamp without time zone',
  deletedAt: 'timestamp without time zone',
  id: 'bigint',
  multicolor: 'balloon_colors_enum[]',
  positionAlpha: 'integer',
  positionBeta: 'integer',
  type: 'balloon_types_enum',
  updatedAt: 'timestamp without time zone',
  userId: 'bigint',
  volume: 'numeric'
}

export const CollarsDBTypeMap = {
  balloonId: 'bigint',
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  lost: 'boolean',
  petId: 'bigint',
  tagName: 'character varying',
  updatedAt: 'timestamp without time zone'
}

export const CompositionAssetAuditsDBTypeMap = {
  approval: 'boolean',
  compositionAssetId: 'bigint',
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  notes: 'text',
  updatedAt: 'timestamp without time zone'
}

export const CompositionAssetsDBTypeMap = {
  compositionId: 'bigint',
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  name: 'character varying',
  primary: 'boolean',
  score: 'integer',
  src: 'text',
  updatedAt: 'timestamp without time zone'
}

export const CompositionsDBTypeMap = {
  content: 'text',
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  primary: 'boolean',
  updatedAt: 'timestamp without time zone',
  userId: 'bigint'
}

export const EdgeCaseAttributesDBTypeMap = {
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  kPop: 'boolean',
  popK: 'character varying',
  popKPop: 'integer',
  updatedAt: 'timestamp without time zone'
}

export const ExtraRatingsDBTypeMap = {
  body: 'text',
  createdAt: 'timestamp without time zone',
  extraRateableId: 'bigint',
  extraRateableType: 'extra_rateable_types_enum',
  id: 'bigint',
  rating: 'integer',
  type: 'extra_rating_types_enum',
  updatedAt: 'timestamp without time zone',
  userId: 'bigint'
}

export const GraphEdgeNodesDBTypeMap = {
  createdAt: 'timestamp without time zone',
  edgeId: 'bigint',
  id: 'bigint',
  nodeId: 'bigint',
  position: 'integer',
  updatedAt: 'timestamp without time zone'
}

export const GraphEdgesDBTypeMap = {
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  name: 'character varying',
  updatedAt: 'timestamp without time zone'
}

export const GraphNodesDBTypeMap = {
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  name: 'character varying',
  updatedAt: 'timestamp without time zone'
}

export const IncompatibleForeignKeyTypeExamplesDBTypeMap = {
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  updatedAt: 'timestamp without time zone',
  userId: 'integer'
}

export const LocalizedTextsDBTypeMap = {
  body: 'text',
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  locale: 'locales_enum',
  localizableId: 'bigint',
  localizableType: 'localizable_types_enum',
  name: 'character varying',
  title: 'character varying',
  updatedAt: 'timestamp without time zone'
}

export const PetsDBTypeMap = {
  createdAt: 'timestamp without time zone',
  deletedAt: 'timestamp without time zone',
  favoriteTreats: 'cat_treats[]',
  id: 'bigint',
  name: 'text',
  species: 'species',
  userId: 'bigint'
}

export const PetUnderstudyJoinModelsDBTypeMap = {
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  petId: 'bigint',
  understudyId: 'bigint',
  updatedAt: 'timestamp without time zone'
}

export const PostsDBTypeMap = {
  body: 'text',
  createdAt: 'timestamp without time zone',
  deletedAt: 'timestamp without time zone',
  id: 'bigint',
  position: 'integer',
  postVisibilityId: 'bigint',
  updatedAt: 'timestamp without time zone',
  userId: 'bigint'
}

export const PostVisibilitiesDBTypeMap = {
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  notes: 'text',
  updatedAt: 'timestamp without time zone',
  visibility: 'boolean'
}

export const RatingsDBTypeMap = {
  body: 'text',
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  rateableId: 'bigint',
  rateableType: 'character varying',
  rating: 'integer',
  updatedAt: 'timestamp without time zone',
  userId: 'bigint'
}

export const SandbagsDBTypeMap = {
  balloonId: 'bigint',
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  updatedAt: 'timestamp without time zone',
  weight: 'integer'
}

export const UsersDBTypeMap = {
  birthdate: 'date',
  createdAt: 'timestamp without time zone',
  deletedAt: 'timestamp without time zone',
  email: 'character varying',
  featuredPostPosition: 'integer',
  id: 'bigint',
  name: 'character varying',
  passwordDigest: 'character varying',
  targetRating: 'integer',
  updatedAt: 'timestamp without time zone'
}

export const UserSettingsDBTypeMap = {
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  likesChalupas: 'boolean',
  updatedAt: 'timestamp without time zone',
  userId: 'bigint'
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
  pet_understudy_join_models: PetUnderstudyJoinModels
  pets: Pets
  post_visibilities: PostVisibilities
  posts: Posts
  ratings: Ratings
  sandbags: Sandbags
  user_settings: UserSettings
  users: Users
}

export interface InterpretedDB {
  balloon_lines: BalloonLineAttributes,
  balloon_spotter_balloons: BalloonSpotterBalloonAttributes,
  balloon_spotters: BalloonSpotterAttributes,
  beautiful_balloons: BeautifulBalloonAttributes,
  collars: CollarAttributes,
  composition_asset_audits: CompositionAssetAuditAttributes,
  composition_assets: CompositionAssetAttributes,
  compositions: CompositionAttributes,
  edge_case_attributes: EdgeCaseAttributeAttributes,
  extra_ratings: ExtraRatingAttributes,
  graph_edge_nodes: GraphEdgeNodeAttributes,
  graph_edges: GraphEdgeAttributes,
  graph_nodes: GraphNodeAttributes,
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExampleAttributes,
  localized_texts: LocalizedTextAttributes,
  pet_understudy_join_models: PetUnderstudyJoinModelAttributes,
  pets: PetAttributes,
  post_visibilities: PostVisibilityAttributes,
  posts: PostAttributes,
  ratings: RatingAttributes,
  sandbags: SandbagAttributes,
  user_settings: UserSettingAttributes,
  users: UserAttributes
}

export class InterpretedDBClass {
  balloon_lines: BalloonLineAttributes
  balloon_spotter_balloons: BalloonSpotterBalloonAttributes
  balloon_spotters: BalloonSpotterAttributes
  beautiful_balloons: BeautifulBalloonAttributes
  collars: CollarAttributes
  composition_asset_audits: CompositionAssetAuditAttributes
  composition_assets: CompositionAssetAttributes
  compositions: CompositionAttributes
  edge_case_attributes: EdgeCaseAttributeAttributes
  extra_ratings: ExtraRatingAttributes
  graph_edge_nodes: GraphEdgeNodeAttributes
  graph_edges: GraphEdgeAttributes
  graph_nodes: GraphNodeAttributes
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExampleAttributes
  localized_texts: LocalizedTextAttributes
  pet_understudy_join_models: PetUnderstudyJoinModelAttributes
  pets: PetAttributes
  post_visibilities: PostVisibilityAttributes
  posts: PostAttributes
  ratings: RatingAttributes
  sandbags: SandbagAttributes
  user_settings: UserSettingAttributes
  users: UserAttributes
}

export const DBColumns = {
  balloon_lines: BalloonLineColumns,
  balloon_spotter_balloons: BalloonSpotterBalloonColumns,
  balloon_spotters: BalloonSpotterColumns,
  beautiful_balloons: BeautifulBalloonColumns,
  collars: CollarColumns,
  composition_asset_audits: CompositionAssetAuditColumns,
  composition_assets: CompositionAssetColumns,
  compositions: CompositionColumns,
  edge_case_attributes: EdgeCaseAttributeColumns,
  extra_ratings: ExtraRatingColumns,
  graph_edge_nodes: GraphEdgeNodeColumns,
  graph_edges: GraphEdgeColumns,
  graph_nodes: GraphNodeColumns,
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExampleColumns,
  localized_texts: LocalizedTextColumns,
  pet_understudy_join_models: PetUnderstudyJoinModelColumns,
  pets: PetColumns,
  post_visibilities: PostVisibilityColumns,
  posts: PostColumns,
  ratings: RatingColumns,
  sandbags: SandbagColumns,
  user_settings: UserSettingColumns,
  users: UserColumns
}

export const DBTypeCache = {
  balloon_lines: BalloonLinesDBTypeMap,
  balloon_spotter_balloons: BalloonSpotterBalloonsDBTypeMap,
  balloon_spotters: BalloonSpottersDBTypeMap,
  beautiful_balloons: BeautifulBalloonsDBTypeMap,
  collars: CollarsDBTypeMap,
  composition_asset_audits: CompositionAssetAuditsDBTypeMap,
  composition_assets: CompositionAssetsDBTypeMap,
  compositions: CompositionsDBTypeMap,
  edge_case_attributes: EdgeCaseAttributesDBTypeMap,
  extra_ratings: ExtraRatingsDBTypeMap,
  graph_edge_nodes: GraphEdgeNodesDBTypeMap,
  graph_edges: GraphEdgesDBTypeMap,
  graph_nodes: GraphNodesDBTypeMap,
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExamplesDBTypeMap,
  localized_texts: LocalizedTextsDBTypeMap,
  pet_understudy_join_models: PetUnderstudyJoinModelsDBTypeMap,
  pets: PetsDBTypeMap,
  post_visibilities: PostVisibilitiesDBTypeMap,
  posts: PostsDBTypeMap,
  ratings: RatingsDBTypeMap,
  sandbags: SandbagsDBTypeMap,
  user_settings: UserSettingsDBTypeMap,
  users: UsersDBTypeMap
} as Partial<Record<keyof DB, any>>
