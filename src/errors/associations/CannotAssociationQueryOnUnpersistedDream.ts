import Dream from '../../Dream.js'

export default class CannotAssociationQueryOnUnpersistedDream extends Error {
  constructor(
    public dream: Dream,
    public associationName: string | number | symbol
  ) {
    super()
  }

  public override get message() {
    return `Cannot perform associationQuery on an unpersisted Dream.
Dream class: ${this.dream.sanitizedConstructorName}
Association: ${this.associationName.toString()}
    `
  }
}
