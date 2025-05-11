import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import PostVisibility from '../models/PostVisibility.js'

// NOTE: this serializer is intentionally exported
// non-default to test that our client api
// generator can support it
export const PostVisibilitySerializer = (data: PostVisibility) =>
  DreamSerializer(PostVisibility, data).rendersOne('post')
