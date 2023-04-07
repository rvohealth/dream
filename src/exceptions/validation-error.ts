import { ValidationType } from '../decorators/validations/shared'

export default class ValidationError extends Error {
  private dreamClassName: string
  private errors: { [key: string]: ValidationType[] }
  constructor(dreamClassName: string, errors: { [key: string]: ValidationType[] }) {
    super()
    this.dreamClassName = dreamClassName
    this.errors = errors
  }

  public get message() {
    return `\
Failed to same ${this.dreamClassName}. The following validation errors occurred while trying to save:

${JSON.stringify(this.errors, null, 2)}
`
  }
}
