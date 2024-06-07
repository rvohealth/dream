import { UpdateableProperties } from '../../src'
import NonSequentialPrimaryKey from '../../test-app/app/models/NonSequentialPrimaryKey'

export default async function createNonSequentialPrimaryKey(
  overrides: UpdateableProperties<NonSequentialPrimaryKey> = {}
) {
  return await NonSequentialPrimaryKey.create({
    ...overrides,
  })
}
