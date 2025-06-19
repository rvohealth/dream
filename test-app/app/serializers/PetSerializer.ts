import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import Pet from '../models/Pet.js'

export default (data: Pet, passthroughData: object) =>
  DreamSerializer(Pet, data, passthroughData)
    .attribute('id', { openapi: { description: 'hello' } })
    .attribute('name')
    .customAttribute('favoriteDaysOfWeek', () => ['Monday', 'Tuesday'], {
      openapi: {
        type: 'string[]',
        description: 'The days the Pet is happiest',
      },
    })
    .attribute('species')
    .rendersMany('ratings')

export const PetSummarySerializer = (data: Pet, $passthrough: object) =>
  DreamSerializer(Pet, data, $passthrough).attribute('id').attribute('favoriteTreats')

export const PetDeepSerializer = (data: Pet, passthroughData: object) =>
  DreamSerializer(Pet, data, passthroughData).rendersMany('ratings', { serializerKey: 'deep' })
