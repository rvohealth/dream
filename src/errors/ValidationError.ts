import { type ValidationType } from '../types/validation.js'

export default class ValidationError extends Error {
  public dreamClassName: string
  public errors: { [key: string]: ValidationType[] }
  constructor(dreamClassName: string, errors: { [key: string]: ValidationType[] }) {
    super()
    this.dreamClassName = dreamClassName
    this.errors = errors
  }

  public get message() {
    return `\
Failed to save ${this.dreamClassName}. The following validation errors occurred while trying to save:

${JSON.stringify(this.errors, null, 2)}
`
  }
}
