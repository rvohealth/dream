import { DreamModelSerializer } from '../../../src/serializer/index.js'
import Pet from '../models/Pet.js'

// @Serializer() // necessary to inject the name "PetSerializer" into the serializer for OpenAPI
const PetSerializer = ($data: Pet, $passthroughData: object) =>
  DreamModelSerializer(Pet, $data, $passthroughData)
    .attribute('id', { description: 'hello' })
    .attribute('name')
    .attributeFunction('favoriteDaysOfWeek', () => ['Monday', 'Tuesday'], {
      type: 'string[]',
      description: 'The days the Pet is happiest',
    })
    .attribute('species')
    .rendersMany('ratings')

export default PetSerializer

// @Serializer() // necessary to inject the name "PetSummarySerializer" into the serializer for OpenAPI
export const PetSummarySerializer = ($data: Pet, $passthrough: object) =>
  DreamModelSerializer(Pet, $data, $passthrough).attribute('id').attribute('favoriteTreats')
