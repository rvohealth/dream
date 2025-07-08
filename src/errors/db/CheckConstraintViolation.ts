import Dream from '../../Dream.js'

export default class CheckConstraintViolation extends Error {
  public dream: Dream
  public error: Error

  constructor({ dream, error }: { dream: Dream; error: Error }) {
    super()
    this.dream = dream
    this.error = error
  }

  public override get message() {
    return this.error.message
  }
}
