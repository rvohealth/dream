export { pgErrorType } from '../db/errors.js'
export { default as NonLoadedAssociation } from '../errors/associations/NonLoadedAssociation.js'
export { default as CreateOrFindByFailedToCreateAndFind } from '../errors/CreateOrFindByFailedToCreateAndFind.js'
export { default as CheckConstraintViolation } from '../errors/db/CheckConstraintViolation.js'
export { default as ColumnOverflow } from '../errors/db/ColumnOverflow.js'
export { default as DataIncompatibleWithDatabaseField } from '../errors/db/DataIncompatibleWithDatabaseField.js'
export { default as DataTypeColumnTypeMismatch } from '../errors/db/DataTypeColumnTypeMismatch.js'
export { default as NotNullViolation } from '../errors/db/NotNullViolation.js'
// Raised by the framework packages layered on Dream, not only by Dream: psychic
// (`src/controller/index.ts`) raises it for a controller's global name, and
// psychic-workers (`src/background/BaseBackgroundedService.ts`,
// `src/background/BaseScheduledService.ts`) for service global names. Both reach it
// through this entry point, so unexporting it breaks the build of every application
// that installs either package.
export { default as GlobalNameNotSet } from '../errors/dream-app/GlobalNameNotSet.js'
export { default as DecryptionError } from '../errors/encrypt/DecryptionError.js'
export { default as DecryptionParseError } from '../errors/encrypt/DecryptionParseError.js'
export { default as DecryptionRotationError } from '../errors/encrypt/DecryptionRotationError.js'
export { default as RecordNotFound } from '../errors/RecordNotFound.js'
// Caught through this entry point by psychic
// (`test-app/src/app/controllers/SerializerTestsController.ts`), which distinguishes it
// to prove a controller can render a missing-serializers failure as a response.
export { default as MissingSerializersDefinition } from '../errors/serializers/MissingSerializersDefinition.js'
export { default as SortableScopeDidNotStabilize } from '../errors/SortableScopeDidNotStabilize.js'
export { default as SortableScopeLockWaitTimedOut } from '../errors/SortableScopeLockWaitTimedOut.js'
export { default as ValidationError } from '../errors/ValidationError.js'
export { InvalidCalendarDate } from '../utils/datetime/CalendarDate.js'
export { InvalidClockTime } from '../utils/datetime/ClockTime.js'
export { InvalidClockTimeTz } from '../utils/datetime/ClockTimeTz.js'
export { InvalidDateTime } from '../utils/datetime/DateTime.js'
