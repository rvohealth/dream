export default class NoUpdateOnAssociationQuery extends Error {
  public override get message() {
    return `
udpate may not be called on an associationQuery. Use updateAssociation instead.
    `
  }
}
