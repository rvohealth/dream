import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import ModelA from '../../models/CircularReference/ModelA.js'

export const CircularReferenceModelASummarySerializer = (circularReferenceModelA: ModelA) =>
  DreamSerializer(ModelA, circularReferenceModelA).attribute('id')

export const CircularReferenceModelASerializer = (circularReferenceModelA: ModelA) =>
  CircularReferenceModelASummarySerializer(circularReferenceModelA)
    .delegatedAttribute('currentLocalizedText', 'title', { openapi: 'string' })
    .rendersOne('modelBChild')
    .rendersOne('modelBChild2')
