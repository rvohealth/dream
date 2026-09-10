import Dream from '../../Dream.js'

/**
 * Installs one database-sourced scalar as the persisted value without
 * replacing the saved-change history established by the current save.
 */
export default function installPersistedAttribute(dream: Dream, column: string, val: any): void {
  dream['currentAttributes'][column] = val
  dream['frozenAttributes'][column] = val
  dream['originalAttributes'][column] = val
}
