export default class UnrecognizedOpenapiShape extends Error {
  constructor(private openapi: any) {
    super()
  }

  public override get message() {
    return `Unrecognized OpenAPI shape:
${JSON.stringify(this.openapi)}`
  }
}
