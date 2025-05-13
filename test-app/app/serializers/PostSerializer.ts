import { DreamSerializer } from '../../../src/serializer/index.js'
import Post from '../models/Post.js'

const PostSerializer = ($data: Post) => DreamSerializer(Post, $data).rendersOne('postVisibility')

export default PostSerializer
