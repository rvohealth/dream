export type Inc<T extends number> =
  // Check `T`'s value on every number from 0 to 9 and return the next value each time.
  // If it's out of scope, just return `never`.
  T extends keyof IncTable ? IncTable[T] : never

type IncTable = { 0: 1; 1: 2; 2: 3; 3: 4; 4: 5; 5: 6; 6: 7; 7: 8; 8: 9; 9: 10 }
