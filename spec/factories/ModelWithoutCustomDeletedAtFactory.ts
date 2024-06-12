import { UpdateableProperties } from '@rvohealth/dream'
import ModelWithoutCustomDeletedAt from '../../../test-app/app/models/ModelWithoutCustomDeletedAt'

export default async function createModelWithoutCustomDeletedAt(
  overrides: UpdateableProperties<ModelWithoutCustomDeletedAt> = {}
) {
  return await ModelWithoutCustomDeletedAt.create({
    ...overrides,
  })
}
