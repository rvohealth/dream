export default class MissingRequiredPassthroughForAssociationOnClause extends Error {
  constructor(private column: string) {
    super()
  }

  public get message() {
    return `
Missing passthrough for association on clause:
Missing passthrough on clause for column: ${this.column}
`
  }
}
