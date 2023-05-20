
import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type BalloonColorsEnum = "blue" | "green" | "red";

export type BalloonTypesEnum = "Latex" | "Mylar";

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
  src: string | null;
  primary: Generated<boolean | null>;
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
  composition_asset_audits: CompositionAssetAudits;
  composition_assets: CompositionAssets;
  compositions: Compositions;
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExamples;
  pets: Pets;
  post_visibilities: PostVisibilities;
  posts: Posts;
  ratings: Ratings;
  user_settings: UserSettings;
  users: Users;
}



export const BalloonColumns = ['id', 'user_id', 'type', 'volume', 'color', 'multicolor', 'deleted_at', 'created_at', 'updated_at']
export const CompositionAssetAuditColumns = ['id', 'composition_asset_id', 'approval', 'created_at', 'updated_at']
export const CompositionAssetColumns = ['id', 'composition_id', 'src', 'primary', 'created_at', 'updated_at']
export const CompositionColumns = ['id', 'user_id', 'content', 'primary', 'created_at', 'updated_at']
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
  src: string | null
  primary: boolean | null
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
  src: 'string|null',
  primary: 'Generated<boolean|null>',
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



export const DBColumns = {
  balloons: BalloonColumns,
  composition_asset_audits: CompositionAssetAuditColumns,
  composition_assets: CompositionAssetColumns,
  compositions: CompositionColumns,
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
  composition_asset_audits: CompositionAssetAuditsTypeCache,
  composition_assets: CompositionAssetsTypeCache,
  compositions: CompositionsTypeCache,
  incompatible_foreign_key_type_examples: IncompatibleForeignKeyTypeExamplesTypeCache,
  pets: PetsTypeCache,
  posts: PostsTypeCache,
  post_visibilities: PostVisibilitiesTypeCache,
  ratings: RatingsTypeCache,
  users: UsersTypeCache,
  user_settings: UserSettingsTypeCache
} as Partial<Record<keyof DB, any>>
