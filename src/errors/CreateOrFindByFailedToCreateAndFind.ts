import Dream from '../Dream.js'

export default class CreateOrFindByFailedToCreateAndFind extends Error {
  private dreamClass: typeof Dream
  private hidingDefaultScopes: string[]

  /**
   * @param dreamClass - the model `createOrFindBy` was called on
   * @param opts.hidingDefaultScopes - when a record matching the find
   * attributes exists but the model's default scopes hide it, the model's
   * removable default scopes, any of which may be the one hiding it
   */
  constructor(
    dreamClass: typeof Dream,
    { hidingDefaultScopes = [] }: { hidingDefaultScopes?: string[] } = {}
  ) {
    super()
    this.dreamClass = dreamClass
    this.hidingDefaultScopes = hidingDefaultScopes
  }

  public override get message() {
    const name = this.dreamClass.sanitizedName

    if (this.hidingDefaultScopes.length) {
      return `
Failed to create instance of ${name}: the insert violated a uniqueness constraint,
and the ${name} matching the find attributes was not found because it is
likely hidden by ${describeDefaultScopes(this.hidingDefaultScopes)}.

createOrFindBy only finds records the model's default scopes return, so it
cannot return a hidden record. Restore the hidden record, or narrow the unique
index so that it covers only the records the default scopes return (for
example, a partial unique index).
      `
    }

    return `
Failed to create instance of ${name}: the insert violated a uniqueness constraint,
and no ${name} matching the find attributes was found.

Possible causes:
  - a \`createWith\` value conflicts with a different record's unique column
  - a find attribute outside the violated unique index differs from the
    conflicting record's value
  - a hook changed a find attribute before the insert, so the lookup used
    the original value
  - the conflicting record was deleted between the failed insert and the lookup
    `
  }
}

export function describeDefaultScopes(scopeNames: string[]) {
  const quoted = scopeNames.map(scopeName => `"${scopeName}"`).join(', ')
  return scopeNames.length === 1 ? `the default scope ${quoted}` : `one of the default scopes ${quoted}`
}
