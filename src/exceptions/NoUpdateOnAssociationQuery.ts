export default class NoUpdateOnAssociationQuery extends Error {
  public get message() {
    return `
udpate may not be called on an associationQuery. Use updateAssociation instead.
    `
  }
}
