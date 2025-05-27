import { inspect } from 'node:util'
import { InternalAnyTypedSerializerRendersMany } from '../../types/serializer.js'

export default class RendersManyMustReceiveArray extends Error {
  constructor(
    private attribute: InternalAnyTypedSerializerRendersMany<any, string>,
    private value: any
  ) {
    super()
  }

  public override get message() {
    return `
Serializer \`rendersMany\` must receive an array; however,
rendersMany \`${this.attribute.name}\` received ${inspect(this.value)}`
  }
}
