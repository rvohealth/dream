import { DreamModelSerializer } from '../../../../src/serializer/index.js'
import EdgeNode from '../../models/Graph/EdgeNode.js'

const GraphEdgeNodeSerializer = ($data: EdgeNode) =>
  DreamModelSerializer(EdgeNode, $data).attribute('edge').attribute('node')

export default GraphEdgeNodeSerializer
