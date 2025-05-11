import Balloon from '../../models/Balloon.js'
import _Latex from '../../models/Balloon/Latex.js'
import BalloonSerializer from '../BalloonSerializer.js'

export default (data: Balloon) => BalloonSerializer(_Latex, data).attribute('color')
