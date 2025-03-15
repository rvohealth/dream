import { UpdateableProperties } from '../../../src/index.js'
import ModelWithSerialPrimaryKey from '../../app/models/ModelWithSerialPrimaryKey.js'

export default async function createModelWithSerialPrimaryKey(
  attrs: UpdateableProperties<ModelWithSerialPrimaryKey> = {}
) {
  return await ModelWithSerialPrimaryKey.create(attrs)
}
