import { Generated } from 'kysely'

export interface UsersTable {
  id: Generated<number>
  email: string
  password_digest: string
  created_at: Date
}

export interface Database {
  users: UsersTable
}
