import { DreamSerializer } from '../../src'

export default function processDynamicallyDefinedSerializers(
  ...serializerClasses: (typeof DreamSerializer<any, any>)[]
) {
  DreamSerializer['globallyInitializingDecorators'] = true
  serializerClasses.forEach(serializerClass => {
    new serializerClass({})
  })
  DreamSerializer['globallyInitializingDecorators'] = false
}
