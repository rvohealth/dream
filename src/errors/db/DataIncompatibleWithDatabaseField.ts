export default class DataIncompatibleWithDatabaseField extends Error {
  constructor(private error: Error) {
    super()
  }

  public override get message() {
    return this.error.message
  }
}
