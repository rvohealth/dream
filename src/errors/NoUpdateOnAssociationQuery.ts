export default class NoUpdateOnAssociationQuery extends Error {
  public override get message() {
    return `
Mutations may not be called on an associationQuery because its ownership constraint cannot be preserved. Use an association-specific mutation method or query the associated model with explicit conditions.
    `
  }
}
