import yoctocolors from 'yoctocolors'
import { indent } from '../../helpers/indent.js'
import serializerGlobalName from '../../serializer/helpers/serializerGlobalName.js'
import { SerializerType } from '../../types/serializer.js'
import { MergedSerializerAssociationTargetSerializer } from './mergeSerializerAssociationEdges.js'

/**
 * @internal
 *
 * Prints one level of `psy i:serialization`'s tree: the heading for an association, then the name
 * of every serializer that renders the target of that association at this point in the walk. That
 * is more than one serializer when the target is an STI base, since each child may register a
 * different serializer under the same key.
 *
 * Those serializers are printed under a *single* heading rather than one heading each, because the
 * caller prints the union of their association trees below, indented one level in from the
 * heading. Repeating the heading per serializer would leave that union sitting directly beneath
 * whichever child's serializer happened to print last, reading as though every sibling's
 * associations belonged to that one child. Grouped, the shape matches what `displaySerialization`
 * prints at the root of the tree — one name, then every serializer that can render it, then one
 * merged tree.
 *
 * A target reached under more than one edge type or serializer-side name (two children of an STI
 * base rendering the same class through `rendersOne` and `rendersMany`, say) gets one heading per
 * distinct (type, name), since those are genuinely different lines rather than repetitions of one.
 */
export default function printSerializerHierarchyLevel({
  targetSerializers,
  forDisplayDepth,
}: {
  targetSerializers: MergedSerializerAssociationTargetSerializer[]
  forDisplayDepth: number
}) {
  const hierarchyLine = '└───'
  const indentation = indent((hierarchyLine.length + 1) * forDisplayDepth, {
    tabWidth: 1,
  })
  const prefix = `${hierarchyLine} `

  groupByHeading(targetSerializers).forEach(({ type, serializerAssociationName, serializers }) => {
    // eslint-disable-next-line no-console
    console.log(indentation + `${prefix}${type} ${yoctocolors.cyan(serializerAssociationName)}`)

    serializers.forEach(serializer => {
      // Interpolated rather than defaulted so the printed line is unchanged for a serializer with no
      // globalName; naming inline serializers in this tree is its own change.
      // eslint-disable-next-line no-console
      console.log(
        yoctocolors.gray(
          indentation + indent(prefix.length, { tabWidth: 1 }) + `${serializerGlobalName(serializer)}`
        )
      )
    })
  })
}

interface SerializerHierarchyHeading {
  type: MergedSerializerAssociationTargetSerializer['type']
  serializerAssociationName: string
  serializers: SerializerType[]
}

/**
 * Collects the serializers rendering a single merged target into one entry per heading they print
 * under — (edge type, serializer-side association name) — preserving the order the serializers
 * were merged in.
 */
function groupByHeading(
  targetSerializers: MergedSerializerAssociationTargetSerializer[]
): SerializerHierarchyHeading[] {
  const headings = new Map<string, SerializerHierarchyHeading>()

  for (const { serializer, type, serializerAssociationName } of targetSerializers) {
    const headingKey = `${type}:${serializerAssociationName}`
    const heading = headings.get(headingKey)

    if (heading === undefined) {
      headings.set(headingKey, { type, serializerAssociationName, serializers: [serializer] })
    } else {
      heading.serializers.push(serializer)
    }
  }

  return [...headings.values()]
}
