import { DreamModelSerializer } from '../../../src/serializer/index.js'
import PostVisibility from '../models/PostVisibility.js'

// NOTE: this serializer is intentionally exported
// non-default to test that our client api
// generator can support it
export const PostVisibilitySerializer = ($data: PostVisibility) =>
  DreamModelSerializer(PostVisibility, $data).rendersOne('post')
