import Mylar from '../../models/Balloon/Mylar.js'
import BalloonSerializer from '../BalloonSerializer.js'

/**
 * Part of the `stiUnion` serializer key. See Balloon/StiUnionAnimalSerializer.
 *
 * Renders `sandbags` identically to its siblings, and renders `balloonLine` via `rendersOne`,
 * whose serializer carries its own nested edge (`balloon`). Animal terminates the same
 * association via `delegatedAttribute`, so the two produce prefix-sharing but non-identical
 * paths that the dedupe cannot collapse.
 */
export default (data: Mylar) =>
  BalloonSerializer(Mylar, data)
    .attribute('mylarOnlyProperty')
    .rendersMany('sandbags')
    .rendersOne('balloonLine')
