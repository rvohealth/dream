import _Latex from '../../models/Balloon/Latex.js'
import BalloonSerializer from '../BalloonSerializer.js'

/**
 * Part of the `stiUnion` serializer key. See Balloon/StiUnionAnimalSerializer.
 *
 * Renders `sandbags` identically to its siblings, and is the only sibling to render
 * `heartRatings`. Latex sorts second of Animal/Latex/Mylar, so `heartRatings` is invisible to a
 * traversal that only walks the alphabetically-first child's serializer.
 */
export default (data: _Latex) =>
  BalloonSerializer(_Latex, data).attribute('multicolor').rendersMany('sandbags').rendersMany('heartRatings')
