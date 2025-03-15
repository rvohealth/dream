import DreamSerializer from '../../../src/serializer.js'
import RendersOne from '../../../src/serializer/decorators/associations/RendersOne.js'
import Post from '../models/Post.js'
import PostVisibility from '../models/PostVisibility.js'

// NOTE: this serializer is intentionally exported
// non-default to test that our client api
// generator can support it
export class PostVisibilitySerializer<DataType extends PostVisibility> extends DreamSerializer<DataType> {
  @RendersOne()
  public post: Post
}
