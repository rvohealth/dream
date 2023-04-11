
import { DateTime } from 'luxon'
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<DateTime>;

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


export const CompositionAssetAuditColumns = ['id', 'composition_asset_id', 'approval', 'created_at', 'updated_at']
export const CompositionAssetColumns = ['id', 'composition_id', 'src', 'created_at', 'updated_at']
export const CompositionColumns = ['id', 'user_id', 'content', 'flexible_id', 'flexible_type', 'created_at', 'updated_at']
export const UserColumns = ['id', 'name', 'type', 'email', 'password', 'created_at', 'updated_at', 'deleted_at']

export const DBColumns = {
  composition_asset_audits: CompositionAssetAuditColumns,
  composition_assets: CompositionAssetColumns,
  compositions: CompositionColumns,
  users: UserColumns
}
