export default class NoUpdateAllOnAssociationQuery extends Error {
  public get message() {
    return `
udpateAll may not be called on an associationQuery. Use associationUpdateQuery instead
    `
  }
}
