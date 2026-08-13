import Dream from '../../Dream.js'
import { ViewModel } from '../../types/dream.js'
import { SerializerResolutionContext } from '../../types/serializer.js'
import serializerResolutionContextMessage from './serializerResolutionContextMessage.js'

export default class MissingSerializersDefinition extends Error {
  constructor(
    private viewModel: Dream | ViewModel,
    private serializerKey?: string | undefined,
    private resolutionContext?: SerializerResolutionContext | undefined
  ) {
    super()
  }

  public override get message() {
    const className = (this.viewModel as Dream)?.sanitizedConstructorName ?? this.viewModel.constructor.name

    return `
Missing serializers definition on class \`${className}\`

Try something like this in your ${className}'s serializer getter:

class ${className} {
  public get serializers(): DreamSerializers<${className}> {
    return {
      default: '${className}Serializer'
    }
  }
  ...
}${serializerResolutionContextMessage(this.serializerKey, this.resolutionContext)}`
  }
}
