import Dream from '../../Dream.js'

export default class JoinAttemptedOnMissingAssociation extends Error {
  public dreamClass: typeof Dream
  public associationName: string

  constructor({ dreamClass, associationName }: { dreamClass: typeof Dream; associationName: string }) {
    super()
    this.dreamClass = dreamClass
    this.associationName = associationName
  }

  public get message() {
    return `
A joins call has been attempted on \`${this.dreamClass.sanitizedName}\` association \`${this.associationName}\`,
but \`${this.dreamClass.sanitizedName}\` does not define association \`${this.associationName}\`.


Either \`${this.associationName}\` is a typo in the joins statement, or association \`${this.associationName}\` needs to be defined on \`${this.dreamClass.name}\`, for example:

class ${this.dreamClass.sanitizedName} {
  ...
  @${this.dreamClass.sanitizedName}.HasMany('SomeModelClass')
  public ${this.associationName}: SomeModelClass[]
}
    `
  }
}
