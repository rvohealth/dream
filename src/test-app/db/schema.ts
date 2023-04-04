
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

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
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface Users {
  id: Generated<number>;
  name: string | null;
  email: string;
  password: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface DB {
  composition_assets: CompositionAssets;
  compositions: Compositions;
  users: Users;
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
  createdAt?:  Generated<Timestamp>;
  updatedAt?:  Generated<Timestamp>;
} 

export interface UserOpts {
  id?:  Generated<number>;
  name?:  string | null;
  email?:  string;
  password?:  string;
  createdAt?:  Generated<Timestamp>;
  updatedAt?:  Generated<Timestamp>;
} 


export const CompositionAssetColumns = ['id', 'composition_id', 'src', 'created_at', 'updated_at']
export const CompositionColumns = ['id', 'user_id', 'created_at', 'updated_at']
export const UserColumns = ['id', 'name', 'email', 'password', 'created_at', 'updated_at']

export interface DBOpts {
  composition_assets: CompositionAssetOpts
  compositions: CompositionOpts
  users: UserOpts
}

export const DBColumns = {
  composition_assets: CompositionAssetColumns,
  compositions: CompositionColumns,
  users: UserColumns
}
