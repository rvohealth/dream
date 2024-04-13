import { Shift } from 'meta-types'
import { Inc } from '../../src/helpers/typeutils'
import { SyncedAssociations } from './associations'
import { ArrayValues, Entries } from 'type-fest'

type TableNamesRecursive<
  InputArr extends readonly unknown[],
  OutputArr extends readonly unknown[],
  SyncedAssociations,
  TableName extends keyof SyncedAssociations,
  Index extends number,
> = Index extends 4
  ? never
  : InputArr['length'] extends 0
    ? [...OutputArr]
    : InputArr extends [infer Head, ...infer Tail]
      ? Head extends keyof SyncedAssociations[TableName]
        ? SyncedAssociations[TableName][Head] extends (keyof SyncedAssociations)[]
          ? SyncedAssociations[TableName][Head][0] extends keyof SyncedAssociations
            ? TableNamesRecursive<
                Shift<InputArr, 1>,
                [...OutputArr, Head],
                SyncedAssociations,
                SyncedAssociations[TableName][Head][0],
                Inc<Index>
              >
            : never
          : never
        : never
      : never

type TableNames<
  InputArr extends readonly unknown[],
  SyncedAssociations,
  TableName extends keyof SyncedAssociations,
> = TableNamesRecursive<InputArr, [], SyncedAssociations, TableName, 0>

// type T = TableNames<['pet', 'collars'], SyncedAssociations, 'collars'>
// const v: T[0] = 'pet'
// const v1: T[1] = 'collars'
// const v2: T[2] = 'pet'

function variadicTest<const T extends unknown[]>(...args: T): TableNames<T, SyncedAssociations, 'collars'> {
  return '' as any
}

function variadicTest2<const T extends readonly unknown[]>(...args: T & ['chalupas']) {}

variadicTest2('chalupas')

// const res = variadicTest('pet', 'collars')
// type M = (typeof res)[0]

// switch (res[2]) {
//   case 'pet':
//     break
// }
