export default class MissingRequiredPassthroughForAssociationOnClause extends Error {
  constructor(private column: string) {
    super()
  }

  public override get message() {
    return `
Missing passthrough for association on clause:
Missing passthrough on clause for column: ${this.column}
`
  }
}
