import Dream from '../../Dream.js'
import { ViewModel } from '../../types/dream.js'

export default class NoGlobalSerializerForSpecifiedKey extends Error {
  constructor(
    private viewModel: Dream | ViewModel,
    private serializerKey: string,
    private globalName: string
  ) {
    super()
  }

  public override get message() {
    const className = (this.viewModel as Dream)?.sanitizedConstructorName ?? this.viewModel.constructor.name

    return `
${className} specified a global name of "${this.globalName}" for serializer key "${this.serializerKey}",
but no serializer corresponds to "${this.globalName}".
`
  }
}
