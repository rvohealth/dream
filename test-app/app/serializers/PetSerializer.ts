import DreamSerializer, { DreamSerializerBuilder } from '../../../src/serializer/index.js'
import Pet from '../models/Pet.js'

// @DreamSerializer() // necessary to inject the name "PetSerializer" into the serializer for OpenAPI
const PetSerializer = ($data: Pet, $passthroughData: object): DreamSerializerBuilder<Pet, object> =>
  DreamSerializer($data, $passthroughData)
    .attribute('id')
    .attribute('name')
    .attribute('favoriteDaysOfWeek', { openapi: { description: 'The days the Pet is happiest' } })
    .attribute('species')
    .attributeFunction('customSpecies', ($data: Pet) => `custom-${$data.species}`)
    .rendersMany('ratings')

export default PetSerializer

// @DreamSerializer() // necessary to inject the name "PetSummarySerializer" into the serializer for OpenAPI
export const PetSummarySerializer = (DataType: Pet, Passthrough: object): DreamSerializerBuilder<Pet, object> =>
  DreamSerializer(DataType, Passthrough).attribute('id').attribute('favoriteTreats')
