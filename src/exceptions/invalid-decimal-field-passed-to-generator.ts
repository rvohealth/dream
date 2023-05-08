export default class InvalidDecimalFieldPassedToGenerator extends Error {
  public attribute: string

  constructor(attribute: string) {
    super()
    this.attribute = attribute
  }

  public get message() {
    return `
      must pass scale and precision after decimal, like so:
        ${this.attribute.split(':')[0]}:decimal:4,2

      received:
        ${this.attribute}
    `
  }
}
