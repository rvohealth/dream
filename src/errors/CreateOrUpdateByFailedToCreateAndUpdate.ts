import Dream from '../Dream.js'
import {
  CreateOrFindFailureCause,
  describeAttributes,
  describeDefaultScopes,
  describePossibleCauses,
  UNDETERMINED_CREATE_OR_FIND_FAILURE,
} from './CreateOrFindByFailedToCreateAndFind.js'

export default class CreateOrUpdateByFailedToCreateAndUpdate extends Error {
  private dreamClass: typeof Dream
  private failureCause: CreateOrFindFailureCause

  /**
   * @param dreamClass - the model `createOrUpdateBy` was called on
   * @param failureCause - what could be told about why the record that
   * blocked the insert was not found
   */
  constructor(
    dreamClass: typeof Dream,
    failureCause: CreateOrFindFailureCause = UNDETERMINED_CREATE_OR_FIND_FAILURE
  ) {
    super()
    this.dreamClass = dreamClass
    this.failureCause = failureCause
  }

  public override get message() {
    const name = this.dreamClass.sanitizedName
    const failureCause = this.failureCause

    switch (failureCause.kind) {
      case 'conflictingAttributes':
        return `
Failed to create instance of ${name}: the insert violated a uniqueness constraint,
and no ${name} matching the find attributes exists to update.

The violated unique index covers the \`with\` ${describeAttributes(failureCause.attributes)},
so a \`with\` value likely conflicts with a different record. createOrUpdateBy
looks the record to update up by the find attributes only; to find a record by
${failureCause.attributes.join(', ')}, pass it as a find attribute instead.
        `

      case 'hiddenByDefaultScope':
        return `
Failed to create instance of ${name}: the insert violated a uniqueness constraint,
and the ${name} to update was not found because it is
likely hidden by ${describeDefaultScopes(failureCause.defaultScopes)}.

createOrUpdateBy only finds records the model's default scopes return, so it
cannot update a hidden record. Restore the hidden record, or narrow the unique
index so that it covers only the records the default scopes return (for
example, a partial unique index).
        `

      case 'undetermined':
        return `
Failed to create instance of ${name}: the insert violated a uniqueness constraint,
and no ${name} matching the find attributes exists to update.

Possible causes:
${describePossibleCauses(failureCause, '`with`')}
        `
    }
  }
}
