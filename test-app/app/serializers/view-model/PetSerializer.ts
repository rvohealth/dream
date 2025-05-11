import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import { CatTreatsValues, SpeciesValues } from '../../../types/db.js'
import PetViewModel from '../../view-models/PetViewModel.js'

export default (data: PetViewModel, passthroughData: object) =>
  PetSummarySerializer(data, passthroughData)
    .attribute('name', { openapi: ['string', 'null'] })
    .customAttribute('favoriteDaysOfWeek', () => ['Monday', 'Tuesday'], {
      openapi: {
        type: 'string[]',
        description: 'The days the Pet is happiest',
      },
    })
    .attribute('species', { openapi: { type: 'string', enum: SpeciesValues } })

export const PetSummarySerializer = (data: PetViewModel, $passthrough: object) =>
  ObjectSerializer(data, $passthrough)
    .attribute('id', { openapi: { type: 'string', description: 'hello' } })
    .attribute('favoriteTreats', { openapi: { type: 'string[]', enum: CatTreatsValues } })
