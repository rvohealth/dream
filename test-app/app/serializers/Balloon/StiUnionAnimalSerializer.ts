import { BalloonLineMaterialsEnumValues } from '../../../types/db.js'
import Animal from '../../models/Balloon/Latex/Animal.js'
import BalloonSerializer from '../BalloonSerializer.js'

/**
 * Part of the `stiUnion` serializer key, which every Balloon STI child registers with a
 * *different* serializer. Used by preloadFor/loadFor specs to prove that preload paths are
 * unioned across every STI child's serializer rather than taken from the alphabetically-first
 * child (which is Animal).
 *
 * Renders `sandbags` exactly as its siblings do (so the resulting path dedupes), and terminates
 * `balloonLine` via `delegatedAttribute` (so it shares a prefix with, but diverges from, Mylar's
 * `rendersOne('balloonLine')`).
 */
export default (data: Animal) =>
  BalloonSerializer(Animal, data)
    .rendersMany('sandbags')
    .delegatedAttribute('balloonLine', 'material', {
      openapi: { type: 'string', enum: BalloonLineMaterialsEnumValues },
    })
