import { UpdateableProperties } from '../../src'
import ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt from '../../test-app/app/models/ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt'

export default async function createModelWithNoPrimaryKeyAndCustomCreatedAt(
  overrides: UpdateableProperties<ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt> = {}
) {
  return await ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt.create({
    ...overrides,
  })
}
