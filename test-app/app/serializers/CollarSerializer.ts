import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import Collar from '../models/Collar.js'

export const CollarSerializer = (data: Collar) =>
  DreamSerializer(Collar, data).attribute('id').attribute('lost').rendersOne('pet')

export const CollarSummarySerializer = (data: Collar) =>
  DreamSerializer(Collar, data)
    .attribute('id')
    .attribute('lost')
    .rendersOne('pet', { serializerKey: 'summary' })

export const CollarDeepSerializer = (data: Collar) =>
  DreamSerializer(Collar, data).rendersOne('pet', { serializerKey: 'deep' })
