export default class SimpleObjectSerializerRendersOneAndManyRequireClassType extends Error {
  constructor(private associationName: string) {
    super()
  }

  public override get message() {
    return `
SimpleObjectSerializer \`rendersOne\` and \`rendersMany\`
options must include \`dreamClass\`, \`viewModelClass\`, or
\`serializerCallback\`.

rendersOne/Many name: ${this.associationName}
`
  }
}
