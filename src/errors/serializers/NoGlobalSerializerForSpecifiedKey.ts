import Dream from '../../Dream.js'
import { ViewModel } from '../../types/dream.js'
import { SerializerResolutionContext } from '../../types/serializer.js'
import serializerResolutionContextMessage from './serializerResolutionContextMessage.js'

export default class NoGlobalSerializerForSpecifiedKey extends Error {
  constructor(
    private viewModel: Dream | ViewModel,
    private serializerKey: string,
    private globalName: string,
    private resolutionContext?: SerializerResolutionContext | undefined
  ) {
    super()
  }

  public override get message() {
    const className = (this.viewModel as Dream)?.sanitizedConstructorName ?? this.viewModel.constructor.name

    return `
${className} specified a global name of "${this.globalName}" for serializer key "${this.serializerKey}",
but no serializer corresponds to "${this.globalName}".${serializerResolutionContextMessage(this.serializerKey, this.resolutionContext)}`
  }
}
