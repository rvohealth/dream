import Dream from '../Dream.js'

/**
 * What `createOrFindBy` and `createOrUpdateBy` could tell about why the
 * record that blocked their insert was not found:
 *
 * - `conflictingAttributes`: the violated unique index covers these
 *   `createWith`/`with` attributes but not every find attribute, so one of
 *   their values likely conflicts with a different record
 * - `hiddenByDefaultScope`: the violated unique index covers only find
 *   attributes, or every find attribute, and a record matching them exists
 *   once these default scopes are removed, so that record is the one the
 *   insert conflicted with
 * - `undetermined`: neither could be established. `hidingDefaultScopes` lists
 *   the default scopes hiding a record that matches the find attributes, if
 *   there is one, and `extraAttributesMayConflict` is true when a
 *   `createWith`/`with` value may be what conflicted
 */
export type CreateOrFindFailureCause =
  | { kind: 'conflictingAttributes'; attributes: string[] }
  | { kind: 'hiddenByDefaultScope'; defaultScopes: string[] }
  | { kind: 'undetermined'; hidingDefaultScopes: string[]; extraAttributesMayConflict: boolean }

export const UNDETERMINED_CREATE_OR_FIND_FAILURE: CreateOrFindFailureCause = {
  kind: 'undetermined',
  hidingDefaultScopes: [],
  extraAttributesMayConflict: true,
}

export default class CreateOrFindByFailedToCreateAndFind extends Error {
  private dreamClass: typeof Dream
  private failureCause: CreateOrFindFailureCause

  /**
   * @param dreamClass - the model `createOrFindBy` was called on
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
and no ${name} matching the find attributes was found.

The violated unique index covers the \`createWith\` ${describeAttributes(failureCause.attributes)},
so a \`createWith\` value likely conflicts with a different record. createOrFindBy
looks the existing record up by the find attributes only; to find a record by
${failureCause.attributes.join(', ')}, pass it as a find attribute instead.
        `

      case 'hiddenByDefaultScope':
        return `
Failed to create instance of ${name}: the insert violated a uniqueness constraint,
and the ${name} matching the find attributes was not found because it is
likely hidden by ${describeDefaultScopes(failureCause.defaultScopes)}.

createOrFindBy only finds records the model's default scopes return, so it
cannot return a hidden record. Restore the hidden record, or narrow the unique
index so that it covers only the records the default scopes return (for
example, a partial unique index).
        `

      case 'undetermined':
        return `
Failed to create instance of ${name}: the insert violated a uniqueness constraint,
and no ${name} matching the find attributes was found.

Possible causes:
${describePossibleCauses(failureCause, '`createWith`')}
        `
    }
  }
}

export function describeDefaultScopes(scopeNames: string[]) {
  const quoted = scopeNames.map(scopeName => `"${scopeName}"`).join(', ')
  return scopeNames.length === 1 ? `the default scope ${quoted}` : `one of the default scopes ${quoted}`
}

export function describeAttributes(attributes: string[]) {
  return `${attributes.length === 1 ? 'attribute' : 'attributes'} ${attributes.join(', ')}`
}

export function describePossibleCauses(
  failureCause: Extract<CreateOrFindFailureCause, { kind: 'undetermined' }>,
  extraAttributesOption: string
) {
  const causes: string[] = []
  if (failureCause.hidingDefaultScopes.length)
    causes.push(
      `a record matching the find attributes exists but is hidden by ${describeDefaultScopes(failureCause.hidingDefaultScopes)}`
    )
  if (failureCause.extraAttributesMayConflict)
    causes.push(`a ${extraAttributesOption} value conflicts with a different record's unique column`)
  causes.push(
    `a find attribute outside the violated unique index differs from the
    conflicting record's value`,
    `a hook changed a find attribute before the insert, so the lookup used
    the original value`,
    'the conflicting record was deleted between the failed insert and the lookup'
  )
  return causes.map(cause => `  - ${cause}`).join('\n')
}
