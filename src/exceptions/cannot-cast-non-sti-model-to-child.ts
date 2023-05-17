import Dream from '../dream'

export default class CannotCastNonSTIModelToChild extends Error {
  public dreamClass: typeof Dream

  constructor(dreamClass: typeof Dream) {
    super()
    this.dreamClass = dreamClass
  }

  public get message() {
    return `
cannot cast to a child class, since the parent class is not an STI model
Dream class: ${this.dreamClass.name}
    `
  }
}
