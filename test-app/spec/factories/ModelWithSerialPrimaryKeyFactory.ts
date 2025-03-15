import { UpdateableProperties } from '../../../src.js'
import ModelWithSerialPrimaryKey from '../../app/models/ModelWithSerialPrimaryKey.js'

export default async function createModelWithSerialPrimaryKey(
  attrs: UpdateableProperties<ModelWithSerialPrimaryKey> = {}
) {
  return await ModelWithSerialPrimaryKey.create(attrs)
}
