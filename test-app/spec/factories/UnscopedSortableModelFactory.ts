import { UpdateableProperties } from '@rvoh/dream'
import UnscopedSortableModel from '../../app/models/UnscopedSortableModel.js'

export default async function createUnscopedSortableModel(
  attrs: UpdateableProperties<UnscopedSortableModel> = {}
) {
  return await UnscopedSortableModel.create(attrs)
}
