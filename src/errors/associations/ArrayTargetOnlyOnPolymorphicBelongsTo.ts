import Dream from '../../Dream.js'

export default class ArrayTargetOnlyOnPolymorphicBelongsTo extends Error {
  public dreamClass: typeof Dream
  public associationName: string

  constructor({ dreamClass, associationName }: { dreamClass: typeof Dream; associationName: string }) {
    super()
    this.dreamClass = dreamClass
    this.associationName = associationName
  }

  public override get message() {
    return `
An array of targets may only be defined on polymorphic BelongsTo associations:
Dream class: ${this.dreamClass.sanitizedName}
Association: ${this.associationName}
`
  }
}
