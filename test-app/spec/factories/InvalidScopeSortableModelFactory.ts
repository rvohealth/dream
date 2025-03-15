import { UpdateableProperties } from '@rvoh/dream'
import InvalidScopeSortableModel from '../../app/models/InvalidScopeSortableModel.js'

export default async function createInvalidScopeSortableModel(
  attrs: UpdateableProperties<InvalidScopeSortableModel> = {}
) {
  return await InvalidScopeSortableModel.create(attrs)
}
