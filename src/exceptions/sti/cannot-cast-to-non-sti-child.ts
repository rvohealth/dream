import Dream from '../../dream'

export default class CannotCastToNonSTIChild extends Error {
  public dreamClass: typeof Dream
  public attemptedDreamClass: typeof Dream

  constructor(dreamClass: typeof Dream, attemptedDreamClass: typeof Dream) {
    super()
    this.dreamClass = dreamClass
    this.attemptedDreamClass = attemptedDreamClass
  }

  public get message() {
    return `
Can only pass BelongsTo associated models as params
Dream class: ${this.dreamClass.name}
Attempted to cast to: ${this.attemptedDreamClass}
    `
  }
}
