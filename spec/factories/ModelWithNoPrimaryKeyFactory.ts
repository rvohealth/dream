import { UpdateableProperties } from '../../src'
import ModelWithNonSequentialPrimaryKey from '../../test-app/app/models/ModelWithNonSequentialPrimaryKey'

export default async function createModelWithNoPrimaryKey(
  overrides: UpdateableProperties<ModelWithNonSequentialPrimaryKey> = {}
) {
  return await ModelWithNonSequentialPrimaryKey.create({
    ...overrides,
  })
}
