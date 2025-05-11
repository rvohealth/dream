export default class DelegationTargetDoesNotExist extends Error {
  constructor(private delegationTarget: string) {
    super()
  }

  public override get message() {
    return `Attempted to delegate to \`${this.delegationTarget}\`, but \`${this.delegationTarget}\` does not exist.`
  }
}
