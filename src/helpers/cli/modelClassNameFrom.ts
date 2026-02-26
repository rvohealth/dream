import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'

/**
 * Returns the model class name, either from an explicit override or derived
 * from the fully qualified model name.
 *
 * @param fullyQualifiedModelName - e.g. "Room/Kitchen"
 * @param modelNameOverride - optional explicit class name, e.g. "Kitchen"
 * @returns The model class name, e.g. "RoomKitchen" (derived) or "Kitchen" (override)
 */
export default function modelClassNameFrom(
  fullyQualifiedModelName: string,
  modelNameOverride?: string
): string {
  if (modelNameOverride) return modelNameOverride
  return globalClassNameFromFullyQualifiedModelName(
    standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  )
}
