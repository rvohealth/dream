import Dream from '../Dream.js'
import { describeDefaultScopes } from './CreateOrFindByFailedToCreateAndFind.js'

export default class CreateOrUpdateByFailedToCreateAndUpdate extends Error {
  private dreamClass: typeof Dream
  private hidingDefaultScopes: string[]

  /**
   * @param dreamClass - the model `createOrUpdateBy` was called on
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
and the ${name} to update was not found because it is
likely hidden by ${describeDefaultScopes(this.hidingDefaultScopes)}.

createOrUpdateBy only finds records the model's default scopes return, so it
cannot update a hidden record. Restore the hidden record, or narrow the unique
index so that it covers only the records the default scopes return (for
example, a partial unique index).
      `
    }

    return `
Failed to create instance of ${name}: the insert violated a uniqueness constraint,
and no ${name} matching the find attributes exists to update.

Possible causes:
  - a \`with\` value conflicts with a different record's unique column
  - a find attribute outside the violated unique index differs from the
    conflicting record's value
  - a hook changed a find attribute before the insert, so the lookup used
    the original value
  - the conflicting record was deleted between the failed insert and the lookup
    `
  }
}
