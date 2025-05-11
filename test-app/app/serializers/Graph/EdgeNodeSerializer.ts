import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import EdgeNode from '../../models/Graph/EdgeNode.js'

export default (data: EdgeNode) => DreamSerializer(EdgeNode, data).rendersOne('edge').rendersOne('node')
