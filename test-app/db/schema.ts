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
  id: Generated<Int8>;
  name: string | null;
  passwordDigest: string;
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
  pet_understudy_join_models: PetUnderstudyJoinModels;
  pets: Pets;
  post_visibilities: PostVisibilities;
  posts: Posts;
  ratings: Ratings;
  sandbags: Sandbags;
  user_settings: UserSettings;
  users: Users;
}


export const BalloonLineColumns = ['id', 'balloonId', 'material', 'createdAt', 'updatedAt']
export const BalloonSpotterBalloonColumns = ['id', 'userId', 'balloonSpotterId', 'balloonId', 'createdAt', 'updatedAt']
export const BalloonSpotterColumns = ['id', 'name', 'createdAt', 'updatedAt']
export const BeautifulBalloonColumns = ['id', 'userId', 'type', 'volume', 'color', 'positionAlpha', 'positionBeta', 'multicolor', 'deletedAt', 'createdAt', 'updatedAt']
export const CollarColumns = ['id', 'petId', 'balloonId', 'lost', 'tagName', 'createdAt', 'updatedAt']
export const CompositionAssetAuditColumns = ['id', 'compositionAssetId', 'notes', 'approval', 'createdAt', 'updatedAt']
export const CompositionAssetColumns = ['id', 'compositionId', 'name', 'src', 'primary', 'score', 'createdAt', 'updatedAt']
export const CompositionColumns = ['id', 'userId', 'content', 'primary', 'createdAt', 'updatedAt']
export const EdgeCaseAttributeColumns = ['id', 'kPop', 'popK', 'popKPop', 'createdAt', 'updatedAt']
export const ExtraRatingColumns = ['type', 'id', 'userId', 'extraRateableId', 'extraRateableType', 'rating', 'body', 'createdAt', 'updatedAt']
export const GraphEdgeNodeColumns = ['id', 'edgeId', 'nodeId', 'position', 'createdAt', 'updatedAt']
export const GraphEdgeColumns = ['id', 'name', 'createdAt', 'updatedAt']
export const GraphNodeColumns = ['id', 'name', 'createdAt', 'updatedAt']
export const IncompatibleForeignKeyTypeExampleColumns = ['id', 'userId', 'createdAt', 'updatedAt']
export const PetColumns = ['id', 'userId', 'favoriteTreats', 'species', 'name', 'deletedAt', 'createdAt']
export const PetUnderstudyJoinModelColumns = ['id', 'petId', 'understudyId', 'createdAt', 'updatedAt']
export const PostColumns = ['id', 'userId', 'postVisibilityId', 'body', 'position', 'deletedAt', 'createdAt', 'updatedAt']
export const PostVisibilityColumns = ['id', 'visibility', 'notes', 'createdAt', 'updatedAt']
export const RatingColumns = ['id', 'userId', 'rateableId', 'rateableType', 'rating', 'body', 'createdAt', 'updatedAt']
export const SandbagColumns = ['id', 'balloonId', 'weight', 'createdAt', 'updatedAt']
export const UserColumns = ['id', 'name', 'email', 'birthdate', 'passwordDigest', 'createdAt', 'updatedAt', 'deletedAt']
export const UserSettingColumns = ['id', 'userId', 'likesChalupas', 'createdAt', 'updatedAt']

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
  id: IdType
  name: string | null
  passwordDigest: string
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
  id: 'bigint',
  balloonId: 'bigint',
  material: 'balloon_line_materials_enum',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const BalloonSpotterBalloonsDBTypeMap = {
  id: 'bigint',
  userId: 'bigint',
  balloonSpotterId: 'bigint',
  balloonId: 'bigint',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const BalloonSpottersDBTypeMap = {
  id: 'bigint',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone',
  name: 'character varying'
}

export const BeautifulBalloonsDBTypeMap = {
  id: 'bigint',
  userId: 'bigint',
  type: 'balloon_types_enum',
  volume: 'numeric',
  color: 'balloon_colors_enum',
  positionAlpha: 'integer',
  positionBeta: 'integer',
  multicolor: 'balloon_colors_enum[]',
  deletedAt: 'timestamp without time zone',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const CollarsDBTypeMap = {
  lost: 'boolean',
  petId: 'bigint',
  balloonId: 'bigint',
  id: 'bigint',
  updatedAt: 'timestamp without time zone',
  createdAt: 'timestamp without time zone',
  tagName: 'character varying'
}

export const CompositionAssetAuditsDBTypeMap = {
  id: 'bigint',
  compositionAssetId: 'bigint',
  approval: 'boolean',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone',
  notes: 'text'
}

export const CompositionAssetsDBTypeMap = {
  updatedAt: 'timestamp without time zone',
  compositionId: 'bigint',
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  primary: 'boolean',
  score: 'integer',
  name: 'character varying',
  src: 'text'
}

export const CompositionsDBTypeMap = {
  id: 'bigint',
  userId: 'bigint',
  primary: 'boolean',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone',
  content: 'text'
}

export const EdgeCaseAttributesDBTypeMap = {
  id: 'bigint',
  kPop: 'boolean',
  popKPop: 'integer',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone',
  popK: 'character varying'
}

export const ExtraRatingsDBTypeMap = {
  updatedAt: 'timestamp without time zone',
  id: 'bigint',
  userId: 'bigint',
  extraRateableId: 'bigint',
  extraRateableType: 'extra_rateable_types_enum',
  rating: 'integer',
  type: 'extra_rating_types_enum',
  createdAt: 'timestamp without time zone',
  body: 'text'
}

export const GraphEdgeNodesDBTypeMap = {
  id: 'bigint',
  edgeId: 'bigint',
  nodeId: 'bigint',
  position: 'integer',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const GraphEdgesDBTypeMap = {
  id: 'bigint',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone',
  name: 'character varying'
}

export const GraphNodesDBTypeMap = {
  id: 'bigint',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone',
  name: 'character varying'
}

export const IncompatibleForeignKeyTypeExamplesDBTypeMap = {
  id: 'bigint',
  userId: 'integer',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const PetsDBTypeMap = {
  species: 'species',
  userId: 'bigint',
  favoriteTreats: 'cat_treats[]',
  id: 'bigint',
  createdAt: 'timestamp without time zone',
  deletedAt: 'timestamp without time zone',
  name: 'text'
}

export const PetUnderstudyJoinModelsDBTypeMap = {
  id: 'bigint',
  petId: 'bigint',
  understudyId: 'bigint',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const PostsDBTypeMap = {
  updatedAt: 'timestamp without time zone',
  userId: 'bigint',
  postVisibilityId: 'bigint',
  id: 'bigint',
  position: 'integer',
  deletedAt: 'timestamp without time zone',
  createdAt: 'timestamp without time zone',
  body: 'text'
}

export const PostVisibilitiesDBTypeMap = {
  id: 'bigint',
  visibility: 'boolean',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone',
  notes: 'text'
}

export const RatingsDBTypeMap = {
  updatedAt: 'timestamp without time zone',
  userId: 'bigint',
  rateableId: 'bigint',
  createdAt: 'timestamp without time zone',
  id: 'bigint',
  rating: 'integer',
  rateableType: 'character varying',
  body: 'text'
}

export const SandbagsDBTypeMap = {
  id: 'bigint',
  balloonId: 'bigint',
  weight: 'integer',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const UsersDBTypeMap = {
  id: 'bigint',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone',
  deletedAt: 'timestamp without time zone',
  birthdate: 'date',
  name: 'character varying',
  email: 'character varying',
  passwordDigest: 'character varying'
}

export const UserSettingsDBTypeMap = {
  id: 'bigint',
  userId: 'bigint',
  likesChalupas: 'boolean',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
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
  pets: Pets
  pet_understudy_join_models: PetUnderstudyJoinModels
  posts: Posts
  post_visibilities: PostVisibilities
  ratings: Ratings
  sandbags: Sandbags
  users: Users
  user_settings: UserSettings
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
  pet_understudy_join_models: PetUnderstudyJoinModelAttributes,
  pets: PetAttributes,
  post_visibilities: PostVisibilityAttributes,
  posts: PostAttributes,
  ratings: RatingAttributes,
  sandbags: SandbagAttributes,
  user_settings: UserSettingAttributes
  users: UserAttributes,
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
  pets: PetAttributes
  pet_understudy_join_models: PetUnderstudyJoinModelAttributes
  posts: PostAttributes
  post_visibilities: PostVisibilityAttributes
  ratings: RatingAttributes
  sandbags: SandbagAttributes
  users: UserAttributes
  user_settings: UserSettingAttributes
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
  pets: PetColumns,
  pet_understudy_join_models: PetUnderstudyJoinModelColumns,
  posts: PostColumns,
  post_visibilities: PostVisibilityColumns,
  ratings: RatingColumns,
  sandbags: SandbagColumns,
  users: UserColumns,
  user_settings: UserSettingColumns
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
  pets: PetsDBTypeMap,
  pet_understudy_join_models: PetUnderstudyJoinModelsDBTypeMap,
  posts: PostsDBTypeMap,
  post_visibilities: PostVisibilitiesDBTypeMap,
  ratings: RatingsDBTypeMap,
  sandbags: SandbagsDBTypeMap,
  users: UsersDBTypeMap,
  user_settings: UserSettingsDBTypeMap
} as Partial<Record<keyof DB, any>>
