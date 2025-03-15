import DreamSerializer from '../../../src/serializer.js'
import RendersOne from '../../../src/serializer/decorators/associations/RendersOne.js'
import Post from '../models/Post.js'
import PostVisibility from '../models/PostVisibility.js'

export default class PostSerializer<DataType extends Post> extends DreamSerializer<DataType> {
  @RendersOne()
  public postVisibility: PostVisibility
}
