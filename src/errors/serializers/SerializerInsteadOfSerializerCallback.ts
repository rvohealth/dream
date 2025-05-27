import isDreamSerializer from '../../serializer/helpers/isDreamSerializer.js'
import { InternalAnyTypedSerializerRendersMany } from '../../types/serializer.js'

export default class SerializerInsteadOfSerializerCallback extends Error {
  constructor(
    private rendersOneOrMany: 'rendersOne' | 'rendersMany',
    private referencingSerializerName: string,
    private attribute: InternalAnyTypedSerializerRendersMany<any, string>
  ) {
    super()
  }

  public override get message() {
    const baseString = `
The \`serializerCallback\` option on the \`${this.attribute.name}\` \`${this.rendersOneOrMany}\`
on serializer \`${this.referencingSerializerName}\``

    if (isDreamSerializer(this.attribute.options?.serializerCallback)) {
      return `${baseString}
is returning a serializer directly. It needs to return a function that
returns a serializer, like so:

\`\`\`
.${this.rendersOneOrMany}('${this.attribute.name}', {
  serializerCallback: () => MySerializer
})
\`\`\`
`
    } else if (this.attribute.options?.serializerCallback) {
      return `${baseString}
specifies something other than a serializer callback.
It should look something like the following:

\`\`\`
.${this.rendersOneOrMany}('${this.attribute.name}', {
  serializerCallback: () => MySerializer
})
\`\`\`
`
    } else {
      return `${baseString}
is throwing an error.
`
    }
  }
}
