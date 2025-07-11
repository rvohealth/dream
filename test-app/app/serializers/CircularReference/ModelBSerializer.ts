import { DreamSerializer } from '../../../../src/index.js'
import ModelB from '../../models/CircularReference/ModelB.js'

export const CircularReferenceModelBSummarySerializer = (circularReferenceModelB: ModelB) =>
  DreamSerializer(ModelB, circularReferenceModelB).attribute('id')

export const CircularReferenceModelBSerializer = (circularReferenceModelB: ModelB) =>
  CircularReferenceModelBSummarySerializer(circularReferenceModelB)
    .delegatedAttribute('currentLocalizedText', 'title', { openapi: 'string' })
    .rendersOne('modelAChild')
