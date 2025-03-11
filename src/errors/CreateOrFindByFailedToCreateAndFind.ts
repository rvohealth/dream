import Dream from '../Dream.js'

export default class CreateOrFindByFailedToCreateAndFind extends Error {
  private dreamClass: typeof Dream

  constructor(dreamClass: typeof Dream) {
    super()
    this.dreamClass = dreamClass
  }

  public get message() {
    return `
Failed to create instance of ${this.dreamClass.sanitizedName} and no matching model exists.

The likely cause is that one of the \`createWith\` fields violates
a uniqueness constraint.
    `
  }
}
