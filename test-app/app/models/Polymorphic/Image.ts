import { DreamColumn } from '../../../../src/types/dream.js'
import { ImageSerializer } from '../../serializers/Polymorphic/ImageSerializer.js'
import ApplicationModel from '../ApplicationModel.js'

// const deco = new Decorators<typeof Image>()

export default class Image extends ApplicationModel {
  public override get table() {
    return 'polymorphic_images' as const
  }

  public get serializers() {
    return {
      default: ImageSerializer,
    }
  }

  public id: DreamColumn<Image, 'id'>
  public url: DreamColumn<Image, 'url'>
  public createdAt: DreamColumn<Image, 'createdAt'>
  public updatedAt: DreamColumn<Image, 'updatedAt'>
}
