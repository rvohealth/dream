import { UpdateableProperties } from '@rvoh/dream'
import InvalidAssociationSortableModel from '../../app/models/InvalidAssociationSortableModel'

export default async function createInvalidAssociationSortableModel(
  attrs: UpdateableProperties<InvalidAssociationSortableModel> = {}
) {
  return await InvalidAssociationSortableModel.create(attrs)
}
