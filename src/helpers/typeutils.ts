export type Inc<T extends number> =
  // Check `T`'s value on every number from 0 to 31 and return the next value each time.
  // If it's out of scope, just return `never`.
  T extends keyof IncTable ? IncTable[T] : never

type IncTable = {
  0: 1
  1: 2
  2: 3
  3: 4
  4: 5
  5: 6
  6: 7
  7: 8
  8: 9
  9: 10
  10: 11
  11: 12
  12: 13
  13: 14
  14: 15
  15: 16
  16: 17
  17: 18
  18: 19
  19: 20
  20: 21
  21: 22
  22: 23
  23: 24
  24: 25
  25: 26
  26: 27
  27: 28
  28: 29
  29: 30
  30: 31
  31: 32
}

export type MergeUnionOfRecordTypes<U extends Record<string, unknown>> = {
  [K in U extends unknown ? keyof U : never]: U extends unknown ? (K extends keyof U ? U[K] : never) : never
}
