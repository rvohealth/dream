export default class NoUpdateAllOnJoins extends Error {
  public get message() {
    return `
udpateAll may not yet be called on joins. As a workaround,
use where + nestedSelect instead, e.g.:

  ModelA.where({ id: ModelB.nestedSelect('modelAId') })
`
  }
}
