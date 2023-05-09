import { HasManyStatement } from '../decorators/associations/has-many'
import { HasOneStatement } from '../decorators/associations/has-one'
import Dream from '../dream'

export default class FailedToSaveDream extends Error {
  public dreamClass: typeof Dream
  public raisedException: Error

  constructor(dreamClass: typeof Dream, raisedException: Error) {
    super()
    this.dreamClass = dreamClass
    this.raisedException = raisedException
  }

  public get message() {
    return `
Failed to save dream
Dream class: ${this.dreamClass.name}
Exception raised: ${this.raisedException}
    `
  }
}
