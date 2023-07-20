
import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type BalloonColorsEnum = "blue" | "green" | "red";

export type BalloonTypesEnum = "Animal" | "Latex" | "Mylar";

export type ExtraRatingTypesEnum = "HeartRating" | "StarRating";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, string | number | bigint, string | number | bigint>;

export type Numeric = ColumnType<string, string | number, string | number>;

export type Species = "cat" | "dog" | "frog";

export type Timestamp = ColumnType<DateTime>
export type IdType = string | number | bigint | undefined;

export interface Balloons {
  id: Generated<Int8>;
  user_id: Int8;
  type: BalloonTypesEnum | null;
  volume: Numeric | null;
  color: BalloonColorsEnum | null;
  multicolor: BalloonColorsEnum[] | null;
  deleted_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Collars {
  id: Generated<Int8>;
  pet_id: Int8;
  lost: boolean | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CompositionAssetAudits {
  id: Generated<Int8>;
  composition_asset_id: Int8;
  approval: boolean | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CompositionAssets {
  id: Generated<Int8>;
  composition_id: Int8;
  name: string | null;
  src: string | null;
  primary: Generated<boolean | null>;
  score: Generated<number | null>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Compositions {
  id: Generated<Int8>;
  user_id: Int8;
  content: string | null;
  primary: Generated<boolean | null>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ExtraRatings {
  type: ExtraRatingTypesEnum | null;
  id: Generated<Int8>;
  user_id: Int8;
  extra_rateable_id: Int8;
  extra_rateable_type: string;
  rating: number | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface GraphEdgeNodes {
  id: Generated<Int8>;
  edge_id: Int8;
  node_id: Int8;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface GraphEdges {
  id: Generated<Int8>;
  name: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface GraphNodes {
  id: Generated<Int8>;
  name: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface IncompatibleForeignKeyTypeExamples {
  id: Generated<Int8>;
  user_id: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Pets {
  id: Generated<Int8>;
  user_id: Int8 | null;
  species: Species | null;
  name: string | null;
  deleted_at: Timestamp | null;
  created_at: Timestamp;
}

export interface Posts {
  id: Generated<Int8>;
  user_id: Int8;
  post_visibility_id: Int8 | null;
  body: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PostVisibilities {
  id: Generated<Int8>;
  visibility: boolean | null;
  notes: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Ratings {
  id: Generated<Int8>;
  user_id: Int8;
  rateable_id: Int8;
  rateable_type: string;
  rating: number | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Users {
  id: Generated<Int8>;
  name: string | null;
  email: string;
  password_digest: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface UserSettings {
  id: Generated<Int8>;
  user_id: Int8;
  likes_chalupas: Generated<boolean>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DB {
  balloons: Balloons;
  collars: Collars;
  composition_asset_audits: CompositionAssetAudits;
  composition_assets: CompositionAssets;
  compositions: Compositions;
  extra_ratings: ExtraRatings;
  graph_edge_nodes: GraphEdgeNodes;
  graph_edges: GraphEdges;
  graph_nodes: GraphNodes;
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExamples;
  pets: Pets;
  post_visibilities: PostVisibilities;
  posts: Posts;
  ratings: Ratings;
  user_settings: UserSettings;
  users: Users;
}



export const BalloonColumns = ['id', 'user_id', 'type', 'volume', 'color', 'multicolor', 'deleted_at', 'created_at', 'updated_at']
export const CollarColumns = ['id', 'pet_id', 'lost', 'created_at', 'updated_at']
export const CompositionAssetAuditColumns = ['id', 'composition_asset_id', 'approval', 'created_at', 'updated_at']
export const CompositionAssetColumns = ['id', 'composition_id', 'name', 'src', 'primary', 'score', 'created_at', 'updated_at']
export const CompositionColumns = ['id', 'user_id', 'content', 'primary', 'created_at', 'updated_at']
export const ExtraRatingColumns = ['type', 'id', 'user_id', 'extra_rateable_id', 'extra_rateable_type', 'rating', 'created_at', 'updated_at']
export const GraphEdgeNodeColumns = ['id', 'edge_id', 'node_id', 'created_at', 'updated_at']
export const GraphEdgeColumns = ['id', 'name', 'created_at', 'updated_at']
export const GraphNodeColumns = ['id', 'name', 'created_at', 'updated_at']
export const IncompatibleForeignKeyTypeExampleColumns = ['id', 'user_id', 'created_at', 'updated_at']
export const PetColumns = ['id', 'user_id', 'species', 'name', 'deleted_at', 'created_at']
export const PostColumns = ['id', 'user_id', 'post_visibility_id', 'body', 'created_at', 'updated_at']
export const PostVisibilityColumns = ['id', 'visibility', 'notes', 'created_at', 'updated_at']
export const RatingColumns = ['id', 'user_id', 'rateable_id', 'rateable_type', 'rating', 'created_at', 'updated_at']
export const UserColumns = ['id', 'name', 'email', 'password_digest', 'created_at', 'updated_at', 'deleted_at']
export const UserSettingColumns = ['id', 'user_id', 'likes_chalupas', 'created_at', 'updated_at']

export interface BalloonAttributes {
  id: IdType
  user_id: IdType
  type: BalloonTypesEnum | null
  volume: number | null
  color: BalloonColorsEnum | null
  multicolor: BalloonColorsEnum[] | null
  deleted_at: DateTime | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface CollarAttributes {
  id: IdType
  pet_id: IdType
  lost: boolean | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface CompositionAssetAuditAttributes {
  id: IdType
  composition_asset_id: IdType
  approval: boolean | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface CompositionAssetAttributes {
  id: IdType
  composition_id: IdType
  name: string | null
  src: string | null
  primary: boolean | null
  score: number | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface CompositionAttributes {
  id: IdType
  user_id: IdType
  content: string | null
  primary: boolean | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface ExtraRatingAttributes {
  type: ExtraRatingTypesEnum | null
  id: IdType
  user_id: IdType
  extra_rateable_id: IdType
  extra_rateable_type: string
  rating: number | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface GraphEdgeNodeAttributes {
  id: IdType
  edge_id: IdType
  node_id: IdType
  created_at: DateTime
  updated_at: DateTime
}  

export interface GraphEdgeAttributes {
  id: IdType
  name: string | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface GraphNodeAttributes {
  id: IdType
  name: string | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface IncompatibleForeignKeyTypeExampleAttributes {
  id: IdType
  user_id: number
  created_at: DateTime
  updated_at: DateTime
}  

export interface PetAttributes {
  id: IdType
  user_id: IdType | null
  species: Species | null
  name: string | null
  deleted_at: DateTime | null
  created_at: DateTime
}  

export interface PostAttributes {
  id: IdType
  user_id: IdType
  post_visibility_id: IdType | null
  body: string | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface PostVisibilityAttributes {
  id: IdType
  visibility: boolean | null
  notes: string | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface RatingAttributes {
  id: IdType
  user_id: IdType
  rateable_id: IdType
  rateable_type: string
  rating: number | null
  created_at: DateTime
  updated_at: DateTime
}  

export interface UserAttributes {
  id: IdType
  name: string | null
  email: string
  password_digest: string
  created_at: DateTime
  updated_at: DateTime
  deleted_at: DateTime | null
}  

export interface UserSettingAttributes {
  id: IdType
  user_id: IdType
  likes_chalupas: boolean
  created_at: DateTime
  updated_at: DateTime
}  


export const BalloonsTypeCache = {
  id: 'Generated<Int8>',
  user_id: 'Int8',
  type: 'BalloonTypesEnum|null',
  volume: 'Numeric|null',
  color: 'BalloonColorsEnum|null',
  multicolor: 'BalloonColorsEnum[]|null',
  deleted_at: 'Timestamp|null',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const CollarsTypeCache = {
  id: 'Generated<Int8>',
  pet_id: 'Int8',
  lost: 'boolean|null',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const CompositionAssetAuditsTypeCache = {
  id: 'Generated<Int8>',
  composition_asset_id: 'Int8',
  approval: 'boolean|null',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const CompositionAssetsTypeCache = {
  id: 'Generated<Int8>',
  composition_id: 'Int8',
  name: 'string|null',
  src: 'string|null',
  primary: 'Generated<boolean|null>',
  score: 'Generated<number|null>',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const CompositionsTypeCache = {
  id: 'Generated<Int8>',
  user_id: 'Int8',
  content: 'string|null',
  primary: 'Generated<boolean|null>',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const ExtraRatingsTypeCache = {
  type: 'ExtraRatingTypesEnum|null',
  id: 'Generated<Int8>',
  user_id: 'Int8',
  extra_rateable_id: 'Int8',
  extra_rateable_type: 'string',
  rating: 'number|null',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const GraphEdgeNodesTypeCache = {
  id: 'Generated<Int8>',
  edge_id: 'Int8',
  node_id: 'Int8',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const GraphEdgesTypeCache = {
  id: 'Generated<Int8>',
  name: 'string|null',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const GraphNodesTypeCache = {
  id: 'Generated<Int8>',
  name: 'string|null',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const IncompatibleForeignKeyTypeExamplesTypeCache = {
  id: 'Generated<Int8>',
  user_id: 'number',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const PetsTypeCache = {
  id: 'Generated<Int8>',
  user_id: 'Int8|null',
  species: 'Species|null',
  name: 'string|null',
  deleted_at: 'Timestamp|null',
  created_at: 'Timestamp'
}  

export const PostsTypeCache = {
  id: 'Generated<Int8>',
  user_id: 'Int8',
  post_visibility_id: 'Int8|null',
  body: 'string|null',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const PostVisibilitiesTypeCache = {
  id: 'Generated<Int8>',
  visibility: 'boolean|null',
  notes: 'string|null',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const RatingsTypeCache = {
  id: 'Generated<Int8>',
  user_id: 'Int8',
  rateable_id: 'Int8',
  rateable_type: 'string',
  rating: 'number|null',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  

export const UsersTypeCache = {
  id: 'Generated<Int8>',
  name: 'string|null',
  email: 'string',
  password_digest: 'string',
  created_at: 'Timestamp',
  updated_at: 'Timestamp',
  deleted_at: 'Timestamp|null'
}  

export const UserSettingsTypeCache = {
  id: 'Generated<Int8>',
  user_id: 'Int8',
  likes_chalupas: 'Generated<boolean>',
  created_at: 'Timestamp',
  updated_at: 'Timestamp'
}  



export interface InterpretedDB {
  balloons: BalloonAttributes,
  collars: CollarAttributes,
  composition_asset_audits: CompositionAssetAuditAttributes,
  composition_assets: CompositionAssetAttributes,
  compositions: CompositionAttributes,
  extra_ratings: ExtraRatingAttributes,
  graph_edge_nodes: GraphEdgeNodeAttributes,
  graph_edges: GraphEdgeAttributes,
  graph_nodes: GraphNodeAttributes,
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExampleAttributes,
  pets: PetAttributes,
  posts: PostAttributes,
  post_visibilities: PostVisibilityAttributes,
  ratings: RatingAttributes,
  users: UserAttributes,
  user_settings: UserSettingAttributes
}

export const DBColumns = {
  balloons: BalloonColumns,
  collars: CollarColumns,
  composition_asset_audits: CompositionAssetAuditColumns,
  composition_assets: CompositionAssetColumns,
  compositions: CompositionColumns,
  extra_ratings: ExtraRatingColumns,
  graph_edge_nodes: GraphEdgeNodeColumns,
  graph_edges: GraphEdgeColumns,
  graph_nodes: GraphNodeColumns,
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExampleColumns,
  pets: PetColumns,
  posts: PostColumns,
  post_visibilities: PostVisibilityColumns,
  ratings: RatingColumns,
  users: UserColumns,
  user_settings: UserSettingColumns
}

export const DBTypeCache = {
  balloons: BalloonsTypeCache,
  collars: CollarsTypeCache,
  composition_asset_audits: CompositionAssetAuditsTypeCache,
  composition_assets: CompositionAssetsTypeCache,
  compositions: CompositionsTypeCache,
  extra_ratings: ExtraRatingsTypeCache,
  graph_edge_nodes: GraphEdgeNodesTypeCache,
  graph_edges: GraphEdgesTypeCache,
  graph_nodes: GraphNodesTypeCache,
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExamplesTypeCache,
  pets: PetsTypeCache,
  posts: PostsTypeCache,
  post_visibilities: PostVisibilitiesTypeCache,
  ratings: RatingsTypeCache,
  users: UsersTypeCache,
  user_settings: UserSettingsTypeCache
} as Partial<Record<keyof DB, any>>
