import Dream from '../../Dream.js'

export default class NonLoadedAssociation extends Error {
  public dreamClass: typeof Dream
  public associationName: string

  constructor({ dreamClass, associationName }: { dreamClass: typeof Dream; associationName: string }) {
    super()
    this.dreamClass = dreamClass
    this.associationName = associationName
  }

  public override get message() {
    return `
Attempting to access \`${this.associationName}\` on an instance of \`${this.dreamClass.sanitizedName}\`,
but \`${this.associationName}\` has not been preloaded or loaded.
`
  }
}
