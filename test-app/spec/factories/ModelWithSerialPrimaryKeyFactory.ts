import { UpdateableProperties } from '../../../src'
import ModelWithSerialPrimaryKey from '../../app/models/ModelWithSerialPrimaryKey'

export default async function createModelWithSerialPrimaryKey(
  attrs: UpdateableProperties<ModelWithSerialPrimaryKey> = {}
) {
  return await ModelWithSerialPrimaryKey.create(attrs)
}
