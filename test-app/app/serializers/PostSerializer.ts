import SerializerDecorators from '../../../src/decorators/SerializerDecorators.js'
import DreamSerializer from '../../../src/serializer/index.js'
import Post from '../models/Post.js'
import PostVisibility from '../models/PostVisibility.js'

const deco = new SerializerDecorators<typeof Post>()

export default class PostSerializer<DataType extends Post> extends DreamSerializer<DataType> {
  @deco.RendersOne(PostVisibility, { through: 'postVisibility' })
  public postVisibility: PostVisibility
}
