import { SerializerResolutionContext } from '../../types/serializer.js'

/**
 * @internal
 *
 * Renders the trailing "how did resolution reach this class" block shared by the five
 * serializer-resolution errors.
 *
 * Every line is independently well-formed and a line is omitted entirely — no placeholder, no empty
 * slot — when the path that raised the error does not have that fact. The paths differ, and
 * deliberately so:
 *
 * - the serializer key is on every path, since it is an argument of resolution itself;
 * - the render edge is present only when a `rendersOne`/`rendersMany` led to the failing class. The
 *   three root entry points (`Dream.serializationMap`, `Dream.displaySerialization` and
 *   `buildSerializerPreloadPaths`) resolve a class the caller named directly, so nothing led there;
 * - the declaring serializer is present only while preload paths and serialization maps are built.
 *   `SerializerRenderer` holds the rendered attribute but not the serializer that declared it;
 * - the STI base is present only where expanding one produced the class the error names.
 */
export default function serializerResolutionContextMessage(
  serializerKey: string | undefined,
  context: SerializerResolutionContext | undefined
): string {
  const lines: [string, string][] = []

  if (serializerKey !== undefined) lines.push(['serializer key', serializerKey])

  const edge = context?.edge
  if (edge)
    lines.push([
      'reached through',
      edge.declaredBy
        ? `${edge.type} \`${edge.associationName}\`, declared by ${edge.declaredBy}`
        : `${edge.type} \`${edge.associationName}\``,
    ])

  if (context?.stiBase) lines.push(['expanded from', `the STI base ${context.stiBase}`])

  if (lines.length === 0) return ''

  return `

Serializer resolution context:

${lines.map(([label, value]) => `  ${`${label}:`.padEnd(LABEL_COLUMN_WIDTH)}${value}`).join('\n')}`
}

/**
 * Fixed rather than computed from the lines actually present, so that the same fact sits in the
 * same column in every one of these errors — a reader comparing two failures is not also comparing
 * two layouts.
 */
const LABEL_COLUMN_WIDTH = 'reached through: '.length
