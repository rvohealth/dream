import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import Node from '../../models/Graph/Node.js'

const GraphNodeSerializer = (data: Node) => DreamSerializer(Node, data).attribute('name')

export default GraphNodeSerializer
