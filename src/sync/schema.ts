import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Users {
  id: Generated<number>;
  email: string;
  password: string;
  created_at: Generated<Timestamp>;
}

export interface DB {
  users: Users;
}
