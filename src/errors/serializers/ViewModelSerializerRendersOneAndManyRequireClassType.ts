export default class ViewModelSerializerRendersOneAndManyRequireClassType extends Error {
  constructor(private associationName: string) {
    super()
  }

  public override get message() {
    return `
ViewModelSerializer \`rendersOne\` and \`rendersMany\`
options must include \`dreamClass\`, \`viewModelClass\`, or
\`serializerCallback\`.

rendersOne/Many name: ${this.associationName}
`
  }
}
