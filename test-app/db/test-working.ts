import { Shift, Last } from 'meta-types'
import { Inc } from '../../src/helpers/typeutils'
import { SyncedAssociations } from './associations'

type AssociationTableNamesRecursive<
  InputArr extends readonly string[],
  OutputArr extends readonly unknown[],
  SyncedAssociations,
  TableName extends keyof SyncedAssociations,
  Index extends number,
> = Index extends 31
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

function variadicTest<
  const T extends readonly string[],
  TableNames extends AssociationTableNamesRecursive<T, [], SyncedAssociations, 'collars', 0>,
  LastAssociations = SyncedAssociations[Last<TableNames> & keyof SyncedAssociations],
  LastTableName = LastAssociations[Last<T> & keyof LastAssociations] extends (keyof SyncedAssociations)[]
    ? LastAssociations[Last<T> & keyof LastAssociations][0]
    : never,
>(
  args: LastTableName extends never
    ? never
    : [...T, keyof SyncedAssociations[LastTableName & keyof SyncedAssociations]]
): TableNames {
  return {} as any
}

const a = variadicTest(['pet', 'uniqueBalloons', 'user', 'compositions'])
const b = variadicTest(['pet', 'collars', 'pet'])
const c = variadicTest([
  'pet',
  'user',
  'firstPet',
  'collars',
  'balloon',
  'sandbags',
  'mylar',
  'sandbags',
  'mylar',
  'user',
  'featuredRatings',
  'rateable',
  'mainCompositionAsset',
  'localizedTexts',
  'localizable',
  'compositionAssetAudits',
  'compositionAsset',
  'compositionAssetAudits',
  'compositionAsset',
  'currentLocalizedText',
  'localizable',
  'compositionAssetAudits',
  'composition',
  'currentLocalizedText',
  'localizable',
  'compositionAssetAudits',
])
const d = variadicTest(['balloon', 'user', 'mainComposition', 'heartRatings', 'extraRateable'])
