import DreamSerializer from '../../../src/serializer'
import RendersOne from '../../../src/serializer/decorators/associations/RendersOne'
import Post from '../models/Post'
import PostVisibility from '../models/PostVisibility'

// NOTE: this serializer is intentionally exported
// non-default to test that our client api
// generator can support it
export class PostVisibilitySerializer<DataType extends PostVisibility> extends DreamSerializer<DataType> {
  @RendersOne()
  public post: Post
}
