import { round } from '../../../src/index.js'
import { DreamModelSerializer } from '../../../src/serializer/index.js'
import EdgeCaseAttribute from '../models/EdgeCaseAttribute.js'

const EdgeCaseAttributeSerializer = ($data: EdgeCaseAttribute) =>
  DreamModelSerializer(EdgeCaseAttribute, $data)
    .attribute('kPop', 'boolean')
    .attribute('popK', 'string')
    .attribute('popKPop', 'number')
    .attributeFunction('roundedPopKPop', $data => round($data.popKPop ?? 0, 2), 'decimal', {
      precision: 2,
    })

export default EdgeCaseAttributeSerializer
