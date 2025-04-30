import Dream from '../Dream.js'

export default class CreateOrUpdateByFailedToCreateAndUpdate extends Error {
  private dreamClass: typeof Dream

  constructor(dreamClass: typeof Dream) {
    super()
    this.dreamClass = dreamClass
  }

  public override get message() {
    return `
Failed to create instance of ${this.dreamClass.sanitizedName} and no matching model exists to update.

The likely cause is that one of the \`with\` fields violates
a uniqueness constraint.
    `
  }
}
