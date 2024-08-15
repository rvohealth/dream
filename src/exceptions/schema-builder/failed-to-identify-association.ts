import Dream from '../../dream'
import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'

export default class FailedToIdentifyAssociation extends Error {
  constructor(
    private modelClass: typeof Dream,
    private associationType: string,
    private associationName: string,
    private globalAssociationNameOrNames: string | string[]
  ) {
    super()
  }

  public get message() {
    const dreamApp = getCachedDreamApplicationOrFail()
    const attemptedName = Array.isArray(this.globalAssociationNameOrNames)
      ? this.globalAssociationNameOrNames[0]
      : this.globalAssociationNameOrNames

    const possibleMatches = Object.keys(dreamApp.models).filter(globalName =>
      new RegExp(attemptedName.slice(0, 3), 'i').test(globalName)
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
on ${this.modelClass.name}, using the global model name "${attemptedName}".

Usually, this is because the global name for
the model is not what you anticipated, which often happens when you are
using models that are in nested directories, since their names can be
counter-intuitive.

We recommend that you lean into the autocomplete when providing the
first argument to an association, since it can help to catch these
familiar gotchas.

${possibleMatchesMessage}

Details:
    dream: ${this.modelClass.name}
    association type: ${this.associationType}
    association name: ${this.associationName}
    attempted model name: ${attemptedName}

Here is a complete list of possible associations:
    ${Object.keys(dreamApp.models).join(',\n    ')}
`
  }
}
