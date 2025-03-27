export default class PrototypePollutingAssignment extends Error {
  private key: string

  constructor(key: string) {
    super()
    this.key = key
  }

  public override get message() {
    return `Passed "${this.key}" as the key to modify an object`
  }
}
