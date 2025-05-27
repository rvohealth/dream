import { inspect } from 'node:util'
import Dream from '../../Dream.js'
import { ViewModel } from '../../types/dream.js'

export default class NonDreamSerializerDerivedFromGlobalSerializerForSpecifiedKey extends Error {
  constructor(
    private viewModel: Dream | ViewModel,
    private serializerKey: string,
    private globalName: string,
    private serializer: any
  ) {
    super()
  }

  public override get message() {
    const className = (this.viewModel as Dream)?.sanitizedConstructorName ?? this.viewModel.constructor.name

    return `
${className} specified a global name of "${this.globalName}" for serializer key "${this.serializerKey}",
but the derived serializer is not a Dream serializer:

${inspect(this.serializer)}
`
  }
}
