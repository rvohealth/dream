import Dream from '../Dream.js'

export default class CannotSaveMissingDream extends Error {
  constructor(dream: Dream) {
    super(
      `Cannot save ${dream.sanitizedConstructorName} with primary key ${String(dream.primaryKeyValue())} because its persisted database row no longer exists.`
    )
    this.name = 'CannotSaveMissingDream'
  }
}
