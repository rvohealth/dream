import { Shift, Reverse, Last, ReverseRest } from 'meta-types'
import { Inc, Decrement } from '../../src/helpers/typeutils'
import { SyncedAssociations } from './associations'
import { ArrayValues, Entries } from 'type-fest'

type AssociationTableNamesRecursive<
  InputArr extends readonly string[],
  OutputArr extends readonly unknown[],
  SyncedAssociations,
  TableName extends keyof SyncedAssociations,
  Index extends number,
> = Index extends 4
  ? never
  : InputArr['length'] extends 1
    ? readonly [...OutputArr, TableName]
    : InputArr extends [infer Head, ...infer Tail]
      ? Head extends keyof SyncedAssociations[TableName]
        ? SyncedAssociations[TableName][Head] extends (keyof SyncedAssociations)[]
          ? SyncedAssociations[TableName][Head][0] extends keyof SyncedAssociations
            ? AssociationTableNamesRecursive<
                Shift<InputArr, 1>,
                [...OutputArr, TableName],
                SyncedAssociations,
                SyncedAssociations[TableName][Head][0],
                Inc<Index>
              >
            : never
          : never
        : never
      : never

type AssociationNamesRecursive<
  InputArr extends readonly string[],
  OutputArr extends readonly unknown[],
  SyncedAssociations,
  TableName extends keyof SyncedAssociations,
  Index extends number,
  OutputInterface extends {
    [K in keyof OutputArr]: OutputArr[K]
  } = {
    [K in keyof OutputArr]: OutputArr[K]
  },
  OutputInterface2 extends {
    [K in keyof SyncedAssociations[TableName]]: SyncedAssociations[TableName][K]
  } = {
    [K in keyof SyncedAssociations[TableName]]: SyncedAssociations[TableName][K]
  },
> = Index extends 4
  ? never
  : InputArr['length'] extends 1
    ? InputArr extends [infer Head extends keyof SyncedAssociations[TableName]]
      ? SyncedAssociations[TableName][Head] extends (keyof SyncedAssociations)[]
        ? SyncedAssociations[TableName][Head][0] extends keyof SyncedAssociations
          ? readonly [
              ...OutputArr,
              keyof SyncedAssociations[TableName],
              // ...(OutputInterface & OutputInterface2),
              // {
              //   [K in keyof SyncedAssociations[TableName]]: SyncedAssociations[TableName][K]
              // }[keyof SyncedAssociations[TableName]],
            ]
          : never
        : never
      : never
    : InputArr extends [infer Head, ...infer Tail]
      ? Head extends keyof SyncedAssociations[TableName]
        ? SyncedAssociations[TableName][Head] extends (keyof SyncedAssociations)[]
          ? SyncedAssociations[TableName][Head][0] extends keyof SyncedAssociations
            ? AssociationNamesRecursive<
                Shift<InputArr, 1>,
                [...{ [K in keyof OutputArr]: OutputArr[K] }, Head],
                SyncedAssociations,
                SyncedAssociations[TableName][Head][0],
                Inc<Index>
              >
            : never
          : never
        : never
      : never

type AssociationNames<
  InputArr extends readonly string[],
  SyncedAssociations,
  TableName extends keyof SyncedAssociations,
> = AssociationNamesRecursive<InputArr, [], SyncedAssociations, TableName, 0>

type FinalAssociationName<
  InputArr extends readonly string[],
  SyncedAssociations,
  TableName extends keyof SyncedAssociations,
> = Last<AssociationNames<InputArr, SyncedAssociations, TableName>>

type FinalTableName<
  InputArr extends readonly string[],
  SyncedAssociations,
  TableName extends keyof SyncedAssociations,
> = InputArr extends [...infer Head extends readonly string[], infer Tail]
  ? Last<AssociationTableNamesRecursive<InputArr, [], SyncedAssociations, TableName, 0>>
  : never
// > = Last<AssociationNames<Reverse<Shift<Reverse<InputArr>, 1>> & readonly string[], SyncedAssociations, TableName>>

type Narrow<T> = {
  [K in keyof T]: K extends keyof [] ? T[K] : T[K] extends (...args: any[]) => unknown ? T[K] : Narrow<T[K]>
}

// type T = AssociationNames<['pet', 'collars'], SyncedAssociations, 'collars'>
// const v: T[0] = 'pet'
// const v1: T[1] = 'collars'
// const v2: T[2] = 'pet'

// type AssociationNamesNewRecursive<
//   InputArray extends string[],
//   OutputArray extends string[],
//   SyncedAssociations,
//   TableName extends keyof SyncedAssociations,
//   Index extends number,
// > = Index extends 4 ? never : InputArray['length'] extends 0 ? OutputArray :
//   InputArray extends [infer Head extends keyof SyncedAssociations[TableName], ...Tail extends string[]] ?
//   AssociationNamesNewRecursive<
//     Shift<InputArray, 1>,
//     [...OutputArray, ],
//   >

// type AssociationNamesNew<InputArray extends string[], SyncedAssociations, TableName extends keyof SyncedAssociations> =
//   InputArray extends [infer keyof SyncedAssociations[TableName], ...Tail extends string[]] ?
//   : never

function variadicTest<const T extends readonly string[]>(
  ...args: T
): AssociationNames<T, SyncedAssociations, 'collars'> {
  return '' as any
}

// type NarrowedArgs extends [...infer All extends string[]]
//   ? AssociationNames<All, SyncedAssociations, 'collars'>
//   : never

// type NewNarrowedArgs<Index extends number = 0> = Index extends 4
//   ? never
//   : this extends string[]
//     ? InputArr['length'] extends 1
//       ? InputArr extends [infer Head extends keyof SyncedAssociations[TableName]]
//         ? SyncedAssociations[TableName][Head] extends (keyof SyncedAssociations)[]
//           ? SyncedAssociations[TableName][Head][0] extends keyof SyncedAssociations
//             ? readonly [
//                 ...OutputArr,
//                 { [K in keyof SyncedAssociations[TableName]]: K }[keyof SyncedAssociations[TableName]],
//               ]
//             : never
//           : never
//         : never
//       : InputArr extends [infer Head, ...infer Tail]
//         ? Head extends keyof SyncedAssociations[TableName]
//           ? SyncedAssociations[TableName][Head] extends (keyof SyncedAssociations)[]
//             ? SyncedAssociations[TableName][Head][0] extends keyof SyncedAssociations
//               ? AssociationNamesRecursive<
//                   Shift<InputArr, 1>,
//                   [...OutputArr, Head],
//                   SyncedAssociations,
//                   SyncedAssociations[TableName][Head][0],
//                   Inc<Index>
//                 >
//               : never
//             : never
//           : never
//         : never
//     : never

function variadicTest2<
  T extends readonly string[] | [],
  AN extends AssociationNames<Narrow<T>, SyncedAssociations, 'collars'> = AssociationNames<
    Narrow<T>,
    SyncedAssociations,
    'collars'
  >,
  // OutputArr extends AssociationNames<Narrow<T>, SyncedAssociations, 'collars'>,
  // FTN extends FinalTableName<Narrow<T>, SyncedAssociations, 'collars'> = FinalTableName<
  //   Narrow<T>,
  //   SyncedAssociations,
  //   'collars'
  // > &
  //   keyof SyncedAssociations,
>(
  args: Narrow<T> & AN
  // args: T extends [...infer All]
  //   ? All extends AssociationNames<All & readonly string[], SyncedAssociations, 'collars'>
  //     ? AssociationNames<All & readonly string[], SyncedAssociations, 'collars'>
  //     : never
  //   : never
  // args: NarrowedArgs
  // args: Narrow<T> extends readonly [
  //   ...Reverse<Shift<Reverse<T>, 1>>,
  //   FinalAssociationName<Narrow<T>, SyncedAssociations, 'collars'>,
  // ]
  //   ? Narrow<T> &
  //       [...Reverse<Shift<Reverse<T>, 1>>, FinalAssociationName<Narrow<T>, SyncedAssociations, 'collars'>]
  //   : never
  // args: Narrow<T> extends readonly [
  //   ...Reverse<Shift<Reverse<T>, 1>>,
  //   FinalAssociationName<Narrow<T>, SyncedAssociations, 'collars'>,
  // ]
  //   ? Narrow<T> &
  //       [
  //         ...Reverse<Shift<Reverse<Narrow<T>>, 1>>,
  //         keyof SyncedAssociations[FinalTableName<Narrow<T>, SyncedAssociations, 'collars'> &
  //           keyof SyncedAssociations],
  //       ]
  //   : never
  // args: Narrow<T> & Narrow<T> extends [...infer Head extends string[], infer Tail extends string]
  //   ? any[]
  //   : never
): FinalTableName<T, SyncedAssociations, 'collars'> & keyof SyncedAssociations {
  return {} as any
}
// ): AssociationNamesRecursive<T, [], SyncedAssociations, 'collars', 0> {
//   return {} as AssociationNamesRecursive<T, [], SyncedAssociations, 'collars', 0>
// }

type AssociationNamesForAssociation<
  InputArray,
  Index,
  PreviousTableName extends keyof SyncedAssociations,
  AssociationName extends keyof SyncedAssociations[PreviousTableName],
> = keyof SyncedAssociations[PreviousTableName]

function variadicTest3<
  const T extends readonly string[],
  U extends string,
  TableNames extends AssociationTableNamesRecursive<Narrow<T>, [], SyncedAssociations, 'collars', 0>,
  LastAssociations = SyncedAssociations[Last<TableNames> & keyof SyncedAssociations],
  LastTableName = LastAssociations[Last<T> & keyof LastAssociations] extends (keyof SyncedAssociations)[]
    ? LastAssociations[Last<T> & keyof LastAssociations][0]
    : never,
  // AN extends AssociationNames<Narrow<T>, SyncedAssociations, 'collars'>,
>(
  args: [
    ...T,
    U & keyof SyncedAssociations[LastTableName & keyof SyncedAssociations],
    // keyof (LastAssociations[keyof LastAssociations] & (keyof SyncedAssociations)[])[0] &
    //   keyof SyncedAssociations,
  ]
  // args: T & AssociationNames<T, SyncedAssociations, 'collars'>
  // args: T &
  //   [
  //     ...Pop<
  //       [
  //         ...{
  //           [K in keyof Narrow<T>]: keyof SyncedAssociations[K extends 0
  //             ? 'collars'
  //             : TableNames[K & keyof TableNames] & keyof SyncedAssociations]
  //           // [K in keyof T]: AssociationNamesForAssociation<
  //           //   T,
  //           //   K,
  //           //   K extends 0
  //           //     ? 'collars'
  //           //     : TableNames[Decrement<K & number> & keyof TableNames] & keyof SyncedAssociations,
  //           //   T[K]
  //           // >
  //         },
  //       ]
  //     >,
  //     keyof SyncedAssociations[Last<TableNames> & keyof SyncedAssociations],
  //   ]
  // args: [
  //   ...Pop<Narrow<T>>,
  //   keyof SyncedAssociations[FinalTableName<Narrow<T>, SyncedAssociations, 'collars'> &
  //     keyof SyncedAssociations],
  // ]
): [U, Last<T>, LastAssociations[Last<T> & keyof LastAssociations], TableNames, LastTableName] {
  return {} as any
}

const blah: AssociationTableNamesRecursive<['pet', 'collars', 'pet'], [], SyncedAssociations, 'collars', 0> =
  ['collars', 'pets', 'collars']

const x = variadicTest3(['pet', 'collars'])
const y = variadicTest3(['pet', 'collars', 'pet'])
const zzzz = variadicTest3(['pet', 'user', 'firstPet'])
zzzz

type Testaronie<
  T extends readonly string[],
  AN extends AssociationNames<Narrow<T>, SyncedAssociations, 'collars'> &
    readonly string[] = AssociationNames<Narrow<T>, SyncedAssociations, 'collars'> & readonly string[],
> = [...{ [K in keyof AN]: AN[K] }]

const zzz: Testaronie<['pet', 'collars']> = ['pet', 'collars']

type Pop<T extends readonly unknown[]> = T extends [...infer Head, infer _] ? Head : never

const t = variadicTest2(['pet', 'collars', 'pet', 'userThroughUuid'])
const w = variadicTest2(['pet'])

type ValueAndHandler<T> = [value: T, handler: (value: T) => void]

type Params<T extends any[]> = {
  valuesAndHandlers: [...{ [I in keyof T]: ValueAndHandler<T[I]> }]
}

// const b = ({} as Params<['a', 'b']>).valuesAndHandlers[0]
// b[1]

const p: Pop<['pet', 'collars']> = ['pet']

const s: AssociationNames<Narrow<['pet', 'collars', 'pet', 'collars']>, SyncedAssociations, 'collars'> &
  {}[] = ['pet', 'collars', 'pet', 'userThroughUuid']

const res = variadicTest('pet', 'collars')
type M = (typeof res)[0]

switch (s[0]) {
  case 'pet':
    break
}
