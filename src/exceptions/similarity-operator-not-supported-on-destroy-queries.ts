import Dream from '../dream'

export default class SimilarityOperatorNotSupportedOnDestroyQueries extends Error {
  private attributes: any
  private dreamClass: typeof Dream
  constructor(dreamClass: typeof Dream, attributes: any) {
    super()
    this.attributes = attributes
    this.dreamClass = dreamClass
  }

  public get message() {
    return `
Cannot pass a similarity operator to a destroy function.
  dream class: "${this.dreamClass.name}"
  attributes: ${JSON.stringify(this.attributes, null, 8)}
    `
  }
}
