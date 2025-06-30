import { HasManyStatement } from '../../../types/associations/hasMany.js'
import { HasOneStatement } from '../../../types/associations/hasOne.js'

export default function throughAssociationHasOptionsBesidesThroughAndSource(
  throughAssociation: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any> | undefined
) {
  const throughAssocForTesting = throughAssociation as HasManyStatement<any, any, any, any>

  return (
    throughAssocForTesting &&
    (throughAssocForTesting.and ||
      throughAssocForTesting.andAny ||
      throughAssocForTesting.andNot ||
      throughAssocForTesting.distinct ||
      throughAssocForTesting.order ||
      throughAssocForTesting.selfAnd ||
      throughAssocForTesting.selfAndNot)
  )
}
