import { Shift } from 'meta-types'

export type StringArray<
  T extends readonly any[],
  OutputArray extends readonly any[] = [],
> = T['length'] extends 0
  ? OutputArray
  : T extends [infer Str extends string, ...any[]]
    ? StringArray<Shift<T, 1>, [...OutputArray, Str]>
    : StringArray<Shift<T, 1>, OutputArray>

export type FindString<T extends readonly any[]> = T extends [string, ...any[]]
  ? T[0] & string
  : FindString<Shift<T, 1>>
