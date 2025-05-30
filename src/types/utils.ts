export type ArrayAttributes<T> = {
  [K in keyof T]: T[K] extends any[] ? K : never
}[keyof T]

export type NonArrayAttributes<T> = {
  [K in keyof T]: T[K] extends any[] ? never : K
}[keyof T]

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

export type Decrement<T extends number> =
  // Check `T`'s value on every number from 0 to 31 and return the next value each time.
  // If it's out of scope, just return `never`.
  T extends keyof DecrementTable ? DecrementTable[T] : never

type DecrementTable = {
  0: -1
  1: 0
  2: 1
  3: 2
  4: 3
  5: 4
  6: 5
  7: 6
  8: 7
  9: 8
  10: 9
  11: 10
  12: 11
  13: 12
  14: 13
  15: 15
  16: 15
  17: 16
  18: 17
  19: 18
  20: 19
  21: 20
  22: 21
  23: 22
  24: 23
  25: 24
  26: 25
  27: 26
  28: 27
  29: 28
  30: 29
  31: 30
}

/**
 *
 *  Given two interfaces that define the same attributes, but with different types for the values,
 *  create a new type that allows all of the types allowed for a particular key by either of the
 * joined types.
 *
 * @example
 * ```
 * type A = {
 *     a: string
 *     c: 'hello'
 * }
 *
 * type B = {
 *     b: number
 *     c: 'world'
 * }
 *
 * type Combined = MergeUnionOfRecordTypes<A | B>
 *
 * // Combined is now equivalent to type {
 * //     a: string,
 * //     b: number,
 * //     c: 'hello' | 'world',
 * // }
 *
 * ```
 * From https://stackoverflow.com/a/72375765/349332
 */

export type MergeUnionOfRecordTypes<U extends Record<string, unknown>> = {
  [K in U extends unknown ? keyof U : never]: U extends unknown ? (K extends keyof U ? U[K] : never) : never
}

// UnionToIntersection
//
// takes a type like
//   { name: string } | { email: string }
//
// and turns it into
//   { name: string } & { email: string }
//
// ideally, this could be replaced by MergeUnionOfRecordTypes, but
// that type is not working for my use case, so I have brought in this
// type helper copied from:
//
// https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void
  ? I
  : never

export type FilterInterface<Source, Condition> = Pick<
  Source,
  { [K in keyof Source]: Source[K] extends Condition ? K : never }[keyof Source]
>

export type RejectInterface<Source, Condition> = Pick<
  Source,
  { [K in keyof Source]: Source[K] extends Condition ? never : K }[keyof Source]
>

// type T = Tail<[1, 2, 3]> // [2, 3]
export type ReadonlyTail<T extends readonly any[]> = T extends readonly [any, ...infer Tail]
  ? Tail
  : readonly []

export type NotReadonlyTail<T extends any[]> = T extends [any, ...infer Tail] ? Tail : []

// type H = Head<[1, 2, 3]> // 1
export type ReadonlyHead<T extends readonly any[]> = T extends readonly [infer Head, ...any]
  ? Head
  : undefined
export type NotReadonlyHead<T extends readonly any[]> = T extends [infer Head, ...any] ? Head : undefined

// type U = Unshift<[1, 2, 3], 0> // [0, 1, 2, 3]
// export type Unshift<T extends readonly any[], E> = [E, ...T]

// type L = Last<[1, 2, 3]> // 3
// type L = Last<['a', 'b', 'c']> // 'c'
// export type Last<T extends readonly any[]> = T[Decrement<T['length']>]

export type FindInterfaceWithValue<T, Key, Value> =
  T extends Readonly<[infer First, ...infer Rest]>
    ? Key extends keyof First
      ? First[Key] extends never
        ? Value extends never
          ? First
          : FindInterfaceWithValue<Rest, Key, Value>
        : First[Key] extends Value
          ? First
          : FindInterfaceWithValue<Rest, Key, Value>
      : FindInterfaceWithValue<Rest, Key, Value>
    : never
