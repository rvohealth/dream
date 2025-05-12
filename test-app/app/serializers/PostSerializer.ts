import { DreamModelSerializer } from '../../../src/serializer/index.js'
import Post from '../models/Post.js'

const PostSerializer = ($data: Post) => DreamModelSerializer(Post, $data).rendersOne('postVisibility')

export default PostSerializer
