import Dream from '../Dream.js'

export default class NonExistentScopeProvidedToResort extends Error {
  private scopes: string[]
  private dreamClass: typeof Dream

  constructor(scopes: string[], dreamClass: typeof Dream) {
    super()
    this.scopes = scopes
    this.dreamClass = dreamClass
  }

  public get message() {
    return `
Only BelongsTo scopes are supported by the #resort method
received:
  dream model class: ${this.dreamClass.sanitizedName}
  scope: ${this.scopes.join(', ')}

BelongsTo scopes on ${this.dreamClass.sanitizedName} are:
  ${this.dreamClass['sortableFields'].map(conf => conf.positionField).join('\n        ')}
    `
  }
}
