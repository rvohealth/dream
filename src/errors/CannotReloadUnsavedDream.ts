import Dream from '../Dream.js'

export default class CannotReloadUnsavedDream extends Error {
  private dream: Dream
  constructor(dream: Dream) {
    super()
    this.dream = dream
  }

  public override get message() {
    return `
Cannot reload a Dream that has not yet been persisted
  dream: ${this.dream['sanitizedConstructorName']}
    `
  }
}
