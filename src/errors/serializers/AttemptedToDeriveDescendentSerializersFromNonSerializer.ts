import { inspect } from 'node:util'

export default class AttemptedToDeriveDescendentSerializersFromNonSerializer extends Error {
  constructor(private serializer: any) {
    super()
  }

  public override get message() {
    return `
Attempted to derive descendent serializers from non serializer:
${inspect(this.serializer)}`
  }
}
