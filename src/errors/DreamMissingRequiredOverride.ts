import Dream from '../Dream.js'

export default class DreamMissingRequiredOverride extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private methodName: string
  ) {
    super()
  }

  public override get message() {
    return `Dream class ${this.dreamClass.sanitizedName} missing required ${this.methodName} override.`
  }
}
