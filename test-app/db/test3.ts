import { Shift, Last, First, Reverse } from 'meta-types'
import { Inc } from '../../src/helpers/typeutils'
import { SyncedAssociations } from './associations'
import { NextJoinsWhereArgumentType } from '../../src/dream/types'
import { DB } from './schema'

type AssociationTableNamesRecursive<
  InputArr extends readonly any[],
  OutputArr extends readonly unknown[],
  SyncedAssociations,
  TableName extends keyof SyncedAssociations,
  Index extends number,
> = Index extends 30
  ? never
  : InputArr['length'] extends 1
    ? readonly [...OutputArr, TableName]
    : InputArr extends [infer Head, ...infer Tail]
      ? Head extends keyof SyncedAssociations[TableName]
        ? SyncedAssociations[TableName][Head] extends (keyof SyncedAssociations)[]
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

type GetLastTableName<
  T extends readonly any[],
  SyncedAssociations,
  TableNames extends AssociationTableNamesRecursive<
    T,
    [],
    SyncedAssociations,
    TableName,
    0
  > = AssociationTableNamesRecursive<T, [], SyncedAssociations, TableName, 0>,
> = FindString<Reverse<TableNames>>

type StringArray<T extends readonly any[], OutputArray extends readonly any[] = []> = T['length'] extends 0
  ? OutputArray
  : T extends [infer Str extends string, ...any[]]
    ? StringArray<Shift<T, 1>, [...OutputArray, Str]>
    : StringArray<Shift<T, 1>, OutputArray>

type FindString<T extends readonly any[]> = T extends [string, ...any[]]
  ? T[0] & string
  : FindString<Shift<T, 1>>

function variadicTest3<
  const T extends readonly any[],
  FilteredT extends StringArray<T>,
  SecondToLastTableName = GetLastTableName<FilteredT>,
  LastAssociations = SyncedAssociations[SecondToLastTableName & keyof SyncedAssociations],
  LastAssociationName = FindString<Reverse<T>>,
  LastTableName = (LastAssociations[LastAssociationName & keyof LastAssociations] &
    (keyof SyncedAssociations)[])[0],
>(
  args: [...T, NextJoinsWhereArgumentType<DB, SyncedAssociations, LastTableName & keyof SyncedAssociations>]
) {}

const a = variadicTest3(['pet', 'collars', { lost: true }, 'pet', 'collars', 'pet', 'collars'])
const b = variadicTest3(['pet', 'collars', 'pet', 'collars', 'pet', { nickname: 'fred' }, 'collars'])
const c = variadicTest3(['pet', 'user', 'firstPet', 'collars', 'balloon'])
const d = variadicTest3([
  'balloon',
  'user',
  'mainComposition',
  'heartRatings',
  'extraRateable',
  { content: 'hello' },
  'user',
])
