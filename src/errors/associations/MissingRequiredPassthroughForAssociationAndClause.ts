export default class MissingRequiredPassthroughForAssociationAndClause extends Error {
  constructor(private column: string) {
    super()
  }

  public override get message() {
    return `
Missing passthrough for association and-clause:
Missing passthrough and-clause for column: ${this.column}
`
  }
}
