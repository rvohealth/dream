import Dream from '../dream'

export default class NonExistentScopeProvidedToSortableDecorator extends Error {
  private scope: string
  private dreamClass: typeof Dream

  constructor(scope: string, dreamClass: typeof Dream) {
    super()
    this.scope = scope
    this.dreamClass = dreamClass
  }

  public get message() {
    return `
Only BelongsTo scopes are supported by the @Sortable decorator.
received:
  dream model class: ${this.dreamClass.name}
  scope: ${this.scope}

BelongsTo scopes on ${this.dreamClass.name} are:
  ${this.dreamClass.associations.belongsTo.map(assoc => assoc.as).join('\n        ')}
    `
  }
}
