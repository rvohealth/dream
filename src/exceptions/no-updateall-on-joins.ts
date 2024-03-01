export default class NoUpdateAllOnJoins extends Error {
  public get message() {
    return `
udpateAll may not be called on joins. Use associationUpdateQuery instead
    `
  }
}
