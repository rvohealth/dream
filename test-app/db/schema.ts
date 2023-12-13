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
  id: Generated<Int8>;
  balloonId: Int8;
  material: BalloonLineMaterialsEnum | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BalloonSpotterBalloons {
  id: Generated<Int8>;
  userId: Int8 | null;
  balloonSpotterId: Int8;
  balloonId: Int8;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BalloonSpotters {
  id: Generated<Int8>;
  name: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BeautifulBalloons {
  id: Generated<Int8>;
  userId: Int8 | null;
  type: BalloonTypesEnum;
  volume: Numeric | null;
  color: BalloonColorsEnum | null;
  positionAlpha: number | null;
  positionBeta: number | null;
  multicolor: BalloonColorsEnum[] | null;
  deletedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Collars {
  id: Generated<Int8>;
  petId: Int8;
  lost: boolean | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompositionAssetAudits {
  id: Generated<Int8>;
  compositionAssetId: Int8;
  notes: string | null;
  approval: boolean | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompositionAssets {
  id: Generated<Int8>;
  compositionId: Int8;
  name: string | null;
  src: string | null;
  primary: Generated<boolean | null>;
  score: Generated<number | null>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Compositions {
  id: Generated<Int8>;
  userId: Int8;
  content: string | null;
  primary: Generated<boolean | null>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EdgeCaseAttributes {
  id: Generated<Int8>;
  kPop: boolean | null;
  popK: string | null;
  popKPop: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ExtraRatings {
  type: ExtraRatingTypesEnum;
  id: Generated<Int8>;
  userId: Int8;
  extraRateableId: Int8;
  extraRateableType: ExtraRateableTypesEnum;
  rating: number | null;
  body: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GraphEdgeNodes {
  id: Generated<Int8>;
  edgeId: Int8;
  nodeId: Int8;
  position: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GraphEdges {
  id: Generated<Int8>;
  name: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GraphNodes {
  id: Generated<Int8>;
  name: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface IncompatibleForeignKeyTypeExamples {
  id: Generated<Int8>;
  userId: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Pets {
  id: Generated<Int8>;
  userId: Int8 | null;
  favoriteTreats: CatTreats[] | null;
  species: Species | null;
  name: string | null;
  deletedAt: Timestamp | null;
  createdAt: Timestamp;
}

export interface Posts {
  id: Generated<Int8>;
  userId: Int8;
  postVisibilityId: Int8 | null;
  body: string | null;
  position: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PostVisibilities {
  id: Generated<Int8>;
  visibility: boolean | null;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Ratings {
  id: Generated<Int8>;
  userId: Int8;
  rateableId: Int8;
  rateableType: string;
  rating: number | null;
  body: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Sandbags {
  id: Generated<Int8>;
  balloonId: Int8;
  weight: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Users {
  id: Generated<Int8>;
  name: string | null;
  email: string;
  birthdate: Timestamp | null;
  passwordDigest: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export interface UserSettings {
  id: Generated<Int8>;
  userId: Int8;
  likesChalupas: Generated<boolean>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
export const CollarColumns = ['id', 'petId', 'lost', 'createdAt', 'updatedAt']
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
export const PostColumns = ['id', 'userId', 'postVisibilityId', 'body', 'position', 'createdAt', 'updatedAt']
export const PostVisibilityColumns = ['id', 'visibility', 'notes', 'createdAt', 'updatedAt']
export const RatingColumns = ['id', 'userId', 'rateableId', 'rateableType', 'rating', 'body', 'createdAt', 'updatedAt']
export const SandbagColumns = ['id', 'balloonId', 'weight', 'createdAt', 'updatedAt']
export const UserColumns = ['id', 'name', 'email', 'birthdate', 'passwordDigest', 'createdAt', 'updatedAt', 'deletedAt']
export const UserSettingColumns = ['id', 'userId', 'likesChalupas', 'createdAt', 'updatedAt']

export interface BalloonLineAttributes {
  id: IdType
  balloonId: IdType
  material: BalloonLineMaterialsEnum | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface BalloonSpotterBalloonAttributes {
  id: IdType
  userId: IdType | null
  balloonSpotterId: IdType
  balloonId: IdType
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface BalloonSpotterAttributes {
  id: IdType
  name: string | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface BeautifulBalloonAttributes {
  id: IdType
  userId: IdType | null
  type: BalloonTypesEnum
  volume: number | null
  color: BalloonColorsEnum | null
  positionAlpha: number | null
  positionBeta: number | null
  multicolor: BalloonColorsEnum[] | null
  deletedAt: DateTime | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface CollarAttributes {
  id: IdType
  petId: IdType
  lost: boolean | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface CompositionAssetAuditAttributes {
  id: IdType
  compositionAssetId: IdType
  notes: string | null
  approval: boolean | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface CompositionAssetAttributes {
  id: IdType
  compositionId: IdType
  name: string | null
  src: string | null
  primary: boolean | null
  score: number | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface CompositionAttributes {
  id: IdType
  userId: IdType
  content: string | null
  primary: boolean | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface EdgeCaseAttributeAttributes {
  id: IdType
  kPop: boolean | null
  popK: string | null
  popKPop: number | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface ExtraRatingAttributes {
  type: ExtraRatingTypesEnum
  id: IdType
  userId: IdType
  extraRateableId: IdType
  extraRateableType: ExtraRateableTypesEnum
  rating: number | null
  body: string | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface GraphEdgeNodeAttributes {
  id: IdType
  edgeId: IdType
  nodeId: IdType
  position: number | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface GraphEdgeAttributes {
  id: IdType
  name: string | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface GraphNodeAttributes {
  id: IdType
  name: string | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface IncompatibleForeignKeyTypeExampleAttributes {
  id: IdType
  userId: number
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface PetAttributes {
  id: IdType
  userId: IdType | null
  favoriteTreats: CatTreats[] | null
  species: Species | null
  name: string | null
  deletedAt: DateTime | null
  createdAt: DateTime
}  

export interface PostAttributes {
  id: IdType
  userId: IdType
  postVisibilityId: IdType | null
  body: string | null
  position: number
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface PostVisibilityAttributes {
  id: IdType
  visibility: boolean | null
  notes: string | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface RatingAttributes {
  id: IdType
  userId: IdType
  rateableId: IdType
  rateableType: string
  rating: number | null
  body: string | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface SandbagAttributes {
  id: IdType
  balloonId: IdType
  weight: number | null
  createdAt: DateTime
  updatedAt: DateTime
}  

export interface UserAttributes {
  id: IdType
  name: string | null
  email: string
  birthdate: DateTime | null
  passwordDigest: string
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt: DateTime | null
}  

export interface UserSettingAttributes {
  id: IdType
  userId: IdType
  likesChalupas: boolean
  createdAt: DateTime
  updatedAt: DateTime
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
  name: 'character varying',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
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
  id: 'bigint',
  petId: 'bigint',
  lost: 'boolean',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const CompositionAssetAuditsDBTypeMap = {
  id: 'bigint',
  compositionAssetId: 'bigint',
  notes: 'text',
  approval: 'boolean',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const CompositionAssetsDBTypeMap = {
  id: 'bigint',
  compositionId: 'bigint',
  name: 'character varying',
  src: 'text',
  primary: 'boolean',
  score: 'integer',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const CompositionsDBTypeMap = {
  id: 'bigint',
  userId: 'bigint',
  content: 'text',
  primary: 'boolean',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const EdgeCaseAttributesDBTypeMap = {
  id: 'bigint',
  kPop: 'boolean',
  popK: 'character varying',
  popKPop: 'integer',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const ExtraRatingsDBTypeMap = {
  type: 'extra_rating_types_enum',
  id: 'bigint',
  userId: 'bigint',
  extraRateableId: 'bigint',
  extraRateableType: 'extra_rateable_types_enum',
  rating: 'integer',
  body: 'text',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
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
  name: 'character varying',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const GraphNodesDBTypeMap = {
  id: 'bigint',
  name: 'character varying',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const IncompatibleForeignKeyTypeExamplesDBTypeMap = {
  id: 'bigint',
  userId: 'integer',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const PetsDBTypeMap = {
  id: 'bigint',
  userId: 'bigint',
  favoriteTreats: 'cat_treats[]',
  species: 'species',
  name: 'text',
  deletedAt: 'timestamp without time zone',
  createdAt: 'timestamp without time zone'
}

export const PostsDBTypeMap = {
  id: 'bigint',
  userId: 'bigint',
  postVisibilityId: 'bigint',
  body: 'text',
  position: 'integer',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const PostVisibilitiesDBTypeMap = {
  id: 'bigint',
  visibility: 'boolean',
  notes: 'text',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
}

export const RatingsDBTypeMap = {
  id: 'bigint',
  userId: 'bigint',
  rateableId: 'bigint',
  rateableType: 'character varying',
  rating: 'integer',
  body: 'text',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone'
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
  name: 'character varying',
  email: 'character varying',
  birthdate: 'date',
  passwordDigest: 'character varying',
  createdAt: 'timestamp without time zone',
  updatedAt: 'timestamp without time zone',
  deletedAt: 'timestamp without time zone'
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
  pets: PetAttributes,
  posts: PostAttributes,
  post_visibilities: PostVisibilityAttributes,
  ratings: RatingAttributes,
  sandbags: SandbagAttributes,
  users: UserAttributes,
  user_settings: UserSettingAttributes
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
  posts: PostsDBTypeMap,
  post_visibilities: PostVisibilitiesDBTypeMap,
  ratings: RatingsDBTypeMap,
  sandbags: SandbagsDBTypeMap,
  users: UsersDBTypeMap,
  user_settings: UserSettingsDBTypeMap
} as Partial<Record<keyof DB, any>>
