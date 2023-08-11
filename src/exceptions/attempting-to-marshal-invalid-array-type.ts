export default class AttemptingToMarshalInvalidArrayType extends Error {
  public given: any
  constructor(given: any) {
    super()
    this.given = given
  }

  public get message() {
    return `
      cannot properly interpret array value. Expecting value to match either
      an array or a postgres-serialized array.

      received:
        ${this.given}
    `
  }
}
