import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import CircularReferenceModel from '../models/CircularReferenceModel.js'

export const CircularReferenceModelSummarySerializer = (circularReferenceModel: CircularReferenceModel) =>
  DreamSerializer(CircularReferenceModel, circularReferenceModel).attribute('id')

export const CircularReferenceModelSerializer = (circularReferenceModel: CircularReferenceModel) =>
  CircularReferenceModelSummarySerializer(circularReferenceModel).rendersMany('child')
