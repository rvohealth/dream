import { UpdateableProperties } from '../../src'
import ModelWithoutCreatedAtButWithFallback from '../../test-app/app/models/ModelWithoutCreatedAtButWithFallback'

export default async function createModelWithoutCreatedAtButWithFallback(
  overrides: UpdateableProperties<ModelWithoutCreatedAtButWithFallback> = {}
) {
  return await ModelWithoutCreatedAtButWithFallback.create({
    ...overrides,
  })
}
