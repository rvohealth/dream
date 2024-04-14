import RendersOne from '../../../src/serializer/decorators/associations/renders-one'
import DreamSerializer from '../../../src/serializer'
import Pet from '../models/Pet'
import PostVisibility from '../models/PostVisibility'

// NOTE: this serializer is intentionally exported
// non-default to test that our client api
// generator can support it
export class PostVisibilitySerializer<DataType extends PostVisibility> extends DreamSerializer<DataType> {
  @RendersOne()
  public pet: Pet

  @RendersOne()
  public understudy: Pet
}
