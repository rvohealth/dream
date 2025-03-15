import { UpdateableProperties } from '@rvoh/dream'
import ModelWithoutDeletedAt from '../../../test-app/app/models/ModelWithoutDeletedAt.js'

export default async function createModelWithoutDeletedAt(
  overrides: UpdateableProperties<ModelWithoutDeletedAt> = {}
) {
  return await ModelWithoutDeletedAt.create({
    ...overrides,
  })
}
