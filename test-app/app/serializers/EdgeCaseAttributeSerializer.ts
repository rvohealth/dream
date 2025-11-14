import round from '../../../src/helpers/round.js'
import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import EdgeCaseAttribute from '../models/EdgeCaseAttribute.js'

export default (data: EdgeCaseAttribute) =>
  DreamSerializer(EdgeCaseAttribute, data)
    .attribute('kPop')
    .attribute('popK')
    .attribute('popKPop')
    .customAttribute('roundedPopKPop', () => round(data.popKPop ?? 0, 2), {
      openapi: 'decimal',
      precision: 2,
    })
