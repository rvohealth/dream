import Dream from '../Dream.js'

/**
 * Raised when saving a persisted instance whose database row no longer exists —
 * the row was deleted between the moment the instance was loaded and the moment
 * the save reached the database.
 *
 * This is the write-side counterpart of `RecordNotFound`, and applications catch
 * it for the same reasons: a request updating a record another request has since
 * deleted should answer 404 or 409 rather than 500, and a background job holding
 * a stale instance should usually drop the work rather than fail loudly. Nothing
 * is written when it is raised.
 *
 * It does not mean the save was rejected — a save that fails validation raises
 * `ValidationError`, and a constraint violation raises its own error. It means
 * the row that the instance stands for is gone.
 *
 * Dream raises it from the query driver, so a custom driver overriding
 * `saveDream` translates its own adapter's empty-result error the same way, as
 * the test-app MySQL driver does.
 */
export default class CannotSaveMissingDream extends Error {
  constructor(dream: Dream) {
    super(
      `Cannot save ${dream.sanitizedConstructorName} with primary key ${String(dream.primaryKeyValue())} because its persisted database row no longer exists.`
    )
  }
}
