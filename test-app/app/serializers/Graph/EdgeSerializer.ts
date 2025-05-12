import { DreamModelSerializer } from '../../../../src/serializer/index.js'
import Edge from '../../models/Graph/Edge.js'

const GraphEdgeSerializer = ($data: Edge) => DreamModelSerializer(Edge, $data).attribute('name')

export default GraphEdgeSerializer
