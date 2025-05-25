import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import Edge from '../../models/Graph/Edge.js'

const GraphEdgeSerializer = (data: Edge) => DreamSerializer(Edge, data).attribute('name')

export default GraphEdgeSerializer
