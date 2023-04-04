
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Compositions {
  id: Generated<number>;
  user_id: Generated<number>;
  created_at: Generated<Timestamp>;
}

export interface Users {
  id: Generated<number>;
  name: string | null;
  email: string;
  password: string;
  created_at: Generated<Timestamp>;
}

export interface DB {
  compositions: Compositions;
  users: Users;
}


export interface CompositionOpts {
  id?:  Generated<number>;
  userId?:  Generated<number>;
  createdAt?:  Generated<Timestamp>;
} 

export interface UserOpts {
  id?:  Generated<number>;
  name?:  string | null;
  email?:  string;
  password?:  string;
  createdAt?:  Generated<Timestamp>;
} 


export const CompositionColumns = ['id', 'user_id', 'created_at']
export const UserColumns = ['id', 'name', 'email', 'password', 'created_at']

export interface DBOpts {
  compositions: CompositionOpts
  users: UserOpts
}

export const DBColumns = {
  compositions: CompositionColumns,
  users: UserColumns
}
