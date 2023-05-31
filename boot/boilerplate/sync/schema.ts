export type IdType = string | number | bigint | undefined

export interface DB {
  _placeholder_: false
}

export interface InterpretedDB {
  _placeholder_: false
}

export const DBColumns = {
  _placeholder_: false,
}

export const DBTypeCache = {
  _placeholder_: false,
} as Partial<Record<keyof DB, any>>
