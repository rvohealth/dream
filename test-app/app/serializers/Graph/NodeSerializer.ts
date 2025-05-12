import { DreamModelSerializer } from '../../../../src/serializer/index.js'
import Node from '../../models/Graph/Node.js'

const GraphNodeSerializer = ($data: Node) => DreamModelSerializer(Node, $data).attribute('name')

export default GraphNodeSerializer
