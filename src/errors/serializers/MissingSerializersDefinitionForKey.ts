import Dream from '../../Dream.js'
import { ViewModel } from '../../types/dream.js'

export default class MissingSerializersDefinitionForKey extends Error {
  constructor(
    private viewModel: Dream | ViewModel,
    private serializerKey: string
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
      ${this.serializerKey}: '<the_global_name_of_a_serializer>'
    }
  }
  ...
}`
  }
}
