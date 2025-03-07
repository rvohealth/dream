import Dream from '../Dream.js'

export default class MissingDeletedAtFieldForSoftDelete extends Error {
  constructor(private dreamClass: typeof Dream) {
    super()
  }

  public get message() {
    const deletedAtField = this.dreamClass.prototype.deletedAtField
    return `
Expected "${deletedAtField}" to be a valid column for the ${this.dreamClass.name} model.
Whenever the using SoftDelete decorator, you must have either a deletedAt column,
or else another column defined, along with an ovrriding getter on your model, like so:

  @SoftDelete()
  class ${this.dreamClass.name} extends ApplicationModel {
    public get deletedAtField() {
      return 'customDeletedAtField' as const
    }
  }`
  }
}
