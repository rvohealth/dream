import camelize from '../camelize.js'

export interface ParsedAttribute {
  /**
   * Segment-1 of the shorthand, with any `@alias` suffix stripped. Verbatim
   * casing from the CLI token. For scalar columns this is the column name
   * (e.g., `email`); for associations this is the fully-qualified model name
   * (e.g., `User`, `Messaging/Message`).
   */
  rawAttributeName: string

  /**
   * The alias name parsed from a `Model@alias:belongs_to` form. `undefined`
   * when the shorthand uses no `@`. Snake_case canonical (matches the
   * convention used by all other shorthand column names) but the value is
   * passed through verbatim — downstream consumers normalize.
   */
  aliasName: string | undefined

  /**
   * Segment-2 — the type keyword, verbatim casing. E.g., `string`,
   * `belongs_to`, `belongsTo`, `enum`, `enum[]`.
   */
  rawAttributeType: string

  /**
   * Normalized type for switch dispatch. Lowercased and camelized so callers
   * can `switch (parsed.normalizedAttributeType) { case 'belongsto': ... }`
   * regardless of which casing the user typed (`belongs_to` /
   * `belongsTo` / `BELONGS_TO`).
   */
  normalizedAttributeType: string

  /**
   * Descriptors after the type keyword, with the trailing `optional` keyword
   * removed if present. Preserved order. E.g., for `style:enum:place_styles:fancy,casual:optional`
   * descriptors = ['place_styles', 'fancy,casual'].
   */
  descriptors: string[]

  /**
   * True when the shorthand ended with `:optional`.
   */
  isOptional: boolean

  /**
   * True when the type keyword ends with `[]` (array form).
   */
  isArray: boolean
}

/**
 * Parse a single `columnsWithTypes` CLI token into its structural pieces.
 *
 * Centralizes the splitting + normalization logic shared across the model
 * generator (`generateDreamContent`), the migration generator
 * (`generateMigrationContent`), the factory generator
 * (`generateFactoryContent`), and Psychic's resource/controller generators.
 * Keeps the shared layer thin: consumers handle their own coercions (e.g.,
 * migration's `email$ → citext`) and filters (e.g., Psychic's `_type`/`_id`
 * exclusion).
 *
 * Returns `null` for malformed tokens (missing name or type).
 *
 * Supported forms (segment-1 only — see `rawAttributeType` for the full
 * vocabulary of types/associations recognized by individual generators):
 *
 *   - `name:type`                          → standard column
 *   - `name:type:optional`                 → nullable column
 *   - `Model:belongs_to[:optional]`        → association with model-derived alias
 *   - `Model@alias:belongs_to[:optional]`  → association with explicit alias
 */
export default function parseAttribute(attribute: string): ParsedAttribute | null {
  const segments = attribute.split(':')
  const rawSegmentOne = segments[0]
  const rawAttributeType = segments[1]
  const descriptors = segments.slice(2)

  if (!rawSegmentOne || !rawAttributeType) return null

  // Split segment-1 on `@` to extract an optional alias. Empty alias after `@`
  // (e.g., `Model@:belongs_to`) is treated as malformed.
  let rawAttributeName = rawSegmentOne
  let aliasName: string | undefined
  const atIndex = rawSegmentOne.indexOf('@')
  if (atIndex !== -1) {
    rawAttributeName = rawSegmentOne.slice(0, atIndex)
    const rawAlias = rawSegmentOne.slice(atIndex + 1)
    if (!rawAttributeName || !rawAlias) return null
    aliasName = rawAlias
  }

  // Pop trailing `optional` keyword off the descriptors list. Mirrors
  // `optionalFromDescriptors` in generateMigrationContent.ts so the keyword
  // behaves identically regardless of which consumer parses the token.
  let isOptional = false
  if (descriptors[descriptors.length - 1] === 'optional') {
    descriptors.pop()
    isOptional = true
  }

  const normalizedAttributeType = camelize(rawAttributeType).toLowerCase()
  const isArray = /\[\]$/.test(rawAttributeType)

  return {
    rawAttributeName,
    aliasName,
    rawAttributeType,
    normalizedAttributeType,
    descriptors,
    isOptional,
    isArray,
  }
}
