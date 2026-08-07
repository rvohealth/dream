import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import BalloonLine from '../models/BalloonLine.js'

export const BallonLineSummarySerializer = (data: BalloonLine) =>
  DreamSerializer(BalloonLine, data).attribute('material')

/**
 * Renders `balloon` — an STI base — through the `stiUnion` serializer key, so the association
 * resolves to a *different* serializer per Balloon child and each of those serializers renders
 * associations of its own.
 *
 * That combination is what makes `displaySerialization`'s output shape observable: this is a
 * non-STI model whose serializer graph reaches an STI base, and the only shape in which "print
 * every child's serializer line, then the union of their trees once" is distinguishable from
 * "print each child's line followed by that child's own tree". Every other STI-base target in the
 * test app resolves to child serializers with no associations, where the two orderings coincide.
 * Pinned by spec/unit/dream/displaySerialization.spec.ts.
 */
export const BalloonLineStiUnionSerializer = (data: BalloonLine) =>
  DreamSerializer(BalloonLine, data).rendersOne('balloon', { serializerKey: 'stiUnion' })

export default (data: BalloonLine) =>
  DreamSerializer(BalloonLine, data).rendersOne('balloon').attribute('material').attribute('createdAt')
