import Dream from '../Dream.js'

export type DreamClassAndAssociationNameTuple = [typeof Dream, string]

export type RecursiveSerializerInfo = {
  [associationName: string]: {
    parentDreamClass: typeof Dream
    nestedSerializerInfo: RecursiveSerializerInfo
  }
}
