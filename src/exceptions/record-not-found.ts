export default class RecordNotFound extends Error {
  public dreamClassName: string
  constructor(dreamClassName: string) {
    super()
    this.dreamClassName = dreamClassName
  }

  public get message() {
    return `\
Failed to find a record for the following dream class: ${this.dreamClassName}
`
  }
}
