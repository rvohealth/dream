import Dream from '../Dream.js'
import { RendersManyOpts } from '../serializer/decorators/associations/RendersMany.js'
import RendersOne, { RendersOneOpts } from '../serializer/decorators/associations/RendersOne.js'
import { SerializableClassOrClasses } from '../types/dream.js'

export default class SerializerDecorators<DreamClass extends typeof Dream> {
  public RendersOne(
    serializableClassOrClasses: SerializableClassOrClasses | RendersOneOpts<DreamClass> | null = null,
    opts?: RendersOneOpts<DreamClass>
  ): any {
    return RendersOne(serializableClassOrClasses, opts)
  }

  public RendersMany(
    serializableClassOrClasses: SerializableClassOrClasses | RendersManyOpts<DreamClass> | null = null,
    opts?: RendersManyOpts<DreamClass>
  ): any {
    return this.RendersMany(serializableClassOrClasses, opts)
  }
}
