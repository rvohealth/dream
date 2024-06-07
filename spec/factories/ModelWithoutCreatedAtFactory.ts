import { UpdateableProperties } from '../../src'
import ModelWithoutCreatedAt from '../../test-app/app/models/ModelWithoutCreatedAt'

export default async function createModelWithoutCreatedAt(
  overrides: UpdateableProperties<ModelWithoutCreatedAt> = {}
) {
  return await ModelWithoutCreatedAt.create({
    ...overrides,
  })
}
