import DreamSerializer from '../../../src/serializer'
import RendersOne from '../../../src/serializer/decorators/associations/renders-one'
import Post from '../models/Post'
import PostVisibility from '../models/PostVisibility'

export default class PostSerializer<DataType extends Post> extends DreamSerializer<DataType> {
  @RendersOne()
  public postVisibility: PostVisibility
}
