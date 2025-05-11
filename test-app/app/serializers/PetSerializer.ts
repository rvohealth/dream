import DreamSerializer from '../../../src/serializer/index.js'
import Pet from '../models/Pet.js'

// @Serializer() // necessary to inject the name "PetSerializer" into the serializer for OpenAPI
const PetSerializer = ($data: Pet, $passthroughData: object) =>
  DreamSerializer($data, $passthroughData)
    .attribute('id')
    .attribute('name')
    .attributeFunction('favoriteDaysOfWeek', () => ['Monday', 'Tuesday'], {
      openapi: { description: 'The days the Pet is happiest' },
    })
    .attribute('species')
    .rendersMany('ratings')

export default PetSerializer

// @Serializer() // necessary to inject the name "PetSummarySerializer" into the serializer for OpenAPI
export const PetSummarySerializer = (DataType: Pet, Passthrough: object) =>
  DreamSerializer(DataType, Passthrough).attribute('id').attribute('favoriteTreats')
