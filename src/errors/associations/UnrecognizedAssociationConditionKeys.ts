export default class UnrecognizedAssociationConditionKeys extends Error {
  constructor(
    private associationName: string,
    private unrecognizedKeys: string[],
    private acceptedKeys: readonly string[],
    private methodName: string | null
  ) {
    super()
  }

  public override get message() {
    const source = this.methodName
      ? `in the object passed to ${this.methodName}('${this.associationName}')`
      : `in the condition on the "${this.associationName}" association`

    return `
Unrecognized key${this.unrecognizedKeys.length === 1 ? '' : 's'} ${source}: ${this.unrecognizedKeys.join(', ')}
Accepted keys: ${this.acceptedKeys.join(', ')}

Where-clauses on an association go under \`and\`, \`andNot\` or \`andAny\`, e.g.:
  { and: { email: 'how@yadoin' } }
`
  }
}
