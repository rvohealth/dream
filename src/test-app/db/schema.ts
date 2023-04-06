
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface CompositionAssetAudits {
  id: Generated<number>;
  composition_asset_id: Generated<number>;
  approval: boolean | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface CompositionAssets {
  id: Generated<number>;
  composition_id: Generated<number>;
  src: string | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface Compositions {
  id: Generated<number>;
  user_id: Generated<number>;
  content: string | null;
  flexible_id: Generated<number>;
  flexible_type: Generated<number>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface Users {
  id: Generated<number>;
  name: string | null;
  type: string | null;
  email: string;
  password: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  deleted_at: Timestamp | null;
}

export interface DB {
  composition_asset_audits: CompositionAssetAudits;
  composition_assets: CompositionAssets;
  compositions: Compositions;
  users: Users;
}


export interface CompositionAssetAuditOpts {
  id?:  Generated<number>;
  compositionAssetId?:  Generated<number>;
  approval?:  boolean | null;
  createdAt?:  Generated<Timestamp>;
  updatedAt?:  Generated<Timestamp>;
} 

export interface CompositionAssetOpts {
  id?:  Generated<number>;
  compositionId?:  Generated<number>;
  src?:  string | null;
  createdAt?:  Generated<Timestamp>;
  updatedAt?:  Generated<Timestamp>;
} 

export interface CompositionOpts {
  id?:  Generated<number>;
  userId?:  Generated<number>;
  content?:  string | null;
  flexibleId?:  Generated<number>;
  flexibleType?:  Generated<number>;
  createdAt?:  Generated<Timestamp>;
  updatedAt?:  Generated<Timestamp>;
} 

export interface UserOpts {
  id?:  Generated<number>;
  name?:  string | null;
  type?:  string | null;
  email?:  string;
  password?:  string;
  createdAt?:  Generated<Timestamp>;
  updatedAt?:  Generated<Timestamp>;
  deletedAt?:  Timestamp | null;
} 


export const CompositionAssetAuditColumns = ['id', 'composition_asset_id', 'approval', 'created_at', 'updated_at']
export const CompositionAssetColumns = ['id', 'composition_id', 'src', 'created_at', 'updated_at']
export const CompositionColumns = ['id', 'user_id', 'content', 'flexible_id', 'flexible_type', 'created_at', 'updated_at']
export const UserColumns = ['id', 'name', 'type', 'email', 'password', 'created_at', 'updated_at', 'deleted_at']

export interface DBOpts {
  composition_asset_audits: CompositionAssetAuditOpts
  composition_assets: CompositionAssetOpts
  compositions: CompositionOpts
  users: UserOpts
}

export const DBColumns = {
  composition_asset_audits: CompositionAssetAuditColumns,
  composition_assets: CompositionAssetColumns,
  compositions: CompositionColumns,
  users: UserColumns
}
