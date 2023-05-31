export type IdType = string | number | bigint | undefined

export interface DB {
  placeholder: false
}

export interface InterpretedDB {
  placeholder: false
}

export const DBColumns = {
  placeholder: false,
}

export const DBTypeCache = {
  placeholder: false,
} as Partial<Record<keyof DB, any>>
