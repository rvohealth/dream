import RendersOne from '../../../src/serializer/decorators/associations/renders-one'
import DreamSerializer from '../../../src/serializer'
import PostVisibility from '../models/PostVisibility'
import Post from '../models/Post'

export default class PostSerializer<DataType extends Post> extends DreamSerializer<DataType> {
  @RendersOne()
  public postVisibility: PostVisibility
}
