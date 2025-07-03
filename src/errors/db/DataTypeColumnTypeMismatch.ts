import Dream from '../../Dream.js'

export default class DataTypeColumnTypeMismatch extends Error {
  public dream: Dream
  public error: Error

  constructor({ dream, error }: { dream: Dream; error: Error }) {
    super()
    this.dream = dream
    this.error = error
  }

  public override get message() {
    return `\
Failed to save ${this.dream.sanitizedConstructorName}:

${this.error.message}
`
  }
}
