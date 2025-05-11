import { DreamSerializer } from '../../../src/serializer/index.js'
import Post from '../models/Post.js'

export default (data: Post) => DreamSerializer(Post, data).rendersOne('postVisibility')
