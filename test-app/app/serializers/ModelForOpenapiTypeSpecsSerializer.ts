import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import ModelForOpenapiTypeSpecs from '../models/ModelForOpenapiTypeSpec.js'

const ModelForOpenapiTypeSpecsSerializer = (data: ModelForOpenapiTypeSpecs) =>
  DreamSerializer(ModelForOpenapiTypeSpecs, data).attribute('startTime').attribute('endTime')

export default ModelForOpenapiTypeSpecsSerializer
