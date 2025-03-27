import Dream from '../../Dream.js'
import DreamApplication from '../../dream-application/index.js'

export default class FailedToIdentifyAssociation extends Error {
  constructor(
    private modelClass: typeof Dream,
    private associationType: string,
    private associationName: string,
    private globalAssociationNameOrNames: string | string[]
  ) {
    super()
  }

  public override get message() {
    const dreamApp = DreamApplication.getOrFail()
    const attemptedName = Array.isArray(this.globalAssociationNameOrNames)
      ? this.globalAssociationNameOrNames[0]
      : this.globalAssociationNameOrNames

    if (typeof attemptedName !== 'string') {
      return `
An unexpected error occurred while looking up an association that you have defined.

While building the schema for your app, we failed to find a match for
the ${this.associationType} association "${this.associationName}" on the
${this.modelClass.sanitizedName} model.

This method requires either a string or string array as the first argument,
to the ${this.associationType} decorator. However, we received the following:

  expected:
    "string"

  received:
    "${typeof attemptedName}"

Details:
    dream: ${this.modelClass.sanitizedName} (${this.modelClass.globalName})
    association type: ${this.associationType}
    association name: ${this.associationName}
".
`
    }

    const possibleMatches = Object.keys(dreamApp.models).filter(globalName =>
      new RegExp(attemptedName.slice(0, Math.min(attemptedName.length, 8)), 'i').test(
        globalName.replace(/\//g, '')
      )
    )

    const possibleMatchesMessage = possibleMatches.length
      ? `\
Did you by chance mean one of these associations?:
    ${possibleMatches.join('\n    ')}`
      : ''

    return `
An unexpected error occurred while looking up an association that you have defined.

While building the schema for your app, we failed to find a match for
the ${this.associationType} association "${this.associationName}"
on ${this.modelClass.sanitizedName}, using the global model name "${attemptedName}".

Usually, this is because the global name for
the model is not what you anticipated, which often happens when you are
using models that are in nested directories, since their names can be
counter-intuitive.

We recommend that you lean into the autocomplete when providing the
first argument to an association, since it can help to catch these
familiar gotchas.

Details:
    dream: ${this.modelClass.sanitizedName} (${this.modelClass.globalName})
    association type: ${this.associationType}
    association name: ${this.associationName}
    attempted model name: ${attemptedName}

${possibleMatchesMessage}

Here is a complete list of possible associations:
    ${Object.keys(dreamApp.models).join(',\n    ')}
`
  }
}
