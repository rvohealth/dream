
import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type BalloonColorEnum = "blue" | "green" | "red";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, string | number | bigint, string | number | bigint>;

export type Species = "cat" | "dog" | "frog";

export type Timestamp = ColumnType<DateTime>;

export interface BalloonBases {
  id: Generated<number>;
  type: string | null;
  user_id: Int8;
  color: BalloonColorEnum | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CompositionAssetAudits {
  id: Generated<number>;
  composition_asset_id: number;
  approval: boolean | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CompositionAssets {
  id: Generated<number>;
  composition_id: number;
  src: string | null;
  primary: Generated<boolean | null>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Compositions {
  id: Generated<number>;
  user_id: number;
  content: string | null;
  primary: Generated<boolean | null>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Pets {
  id: Generated<number>;
  species: Species | null;
  name: string | null;
  user_id: number | null;
  created_at: Timestamp;
}

export interface Posts {
  id: Generated<number>;
  user_id: number;
  post_visibility_id: Int8 | null;
  body: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PostVisibilities {
  id: Generated<number>;
  visibility: boolean | null;
  notes: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Ratings {
  id: Generated<number>;
  user_id: number;
  rateable_id: number;
  rateable_type: string;
  rating: number | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Users {
  id: Generated<number>;
  name: string | null;
  type: string | null;
  email: string;
  password: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

export interface UserSettings {
  id: Generated<number>;
  user_id: number;
  likes_chalupas: Generated<boolean>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DB {
  balloon_bases: BalloonBases;
  composition_asset_audits: CompositionAssetAudits;
  composition_assets: CompositionAssets;
  compositions: Compositions;
  pets: Pets;
  post_visibilities: PostVisibilities;
  posts: Posts;
  ratings: Ratings;
  user_settings: UserSettings;
  users: Users;
}


export const BalloonBaseColumns = ['id', 'type', 'user_id', 'color', 'created_at', 'updated_at']
export const CompositionAssetAuditColumns = ['id', 'composition_asset_id', 'approval', 'created_at', 'updated_at']
export const CompositionAssetColumns = ['id', 'composition_id', 'src', 'primary', 'created_at', 'updated_at']
export const CompositionColumns = ['id', 'user_id', 'content', 'primary', 'created_at', 'updated_at']
export const PetColumns = ['id', 'species', 'name', 'user_id', 'created_at']
export const PostColumns = ['id', 'user_id', 'post_visibility_id', 'body', 'created_at', 'updated_at']
export const PostVisibilityColumns = ['id', 'visibility', 'notes', 'created_at', 'updated_at']
export const RatingColumns = ['id', 'user_id', 'rateable_id', 'rateable_type', 'rating', 'created_at', 'updated_at']
export const UserColumns = ['id', 'name', 'type', 'email', 'password', 'created_at', 'updated_at', 'deleted_at']
export const UserSettingColumns = ['id', 'user_id', 'likes_chalupas', 'created_at', 'updated_at']

export const DBColumns = {
  balloon_bases: BalloonBaseColumns,
  composition_asset_audits: CompositionAssetAuditColumns,
  composition_assets: CompositionAssetColumns,
  compositions: CompositionColumns,
  pets: PetColumns,
  posts: PostColumns,
  post_visibilities: PostVisibilityColumns,
  ratings: RatingColumns,
  users: UserColumns,
  user_settings: UserSettingColumns
}
