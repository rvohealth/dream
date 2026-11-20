export default class UnrecognizedOpenapiShorthand extends Error {
  constructor(private shorthand: any) {
    super()
  }

  public override get message() {
    return `Unrecognized OpenAPI shorthand: ${JSON.stringify(this.shorthand)}`
  }
}
