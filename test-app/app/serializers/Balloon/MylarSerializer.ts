import Balloon from '../../models/Balloon.js'
import Mylar from '../../models/Balloon/Mylar.js'
import BalloonSerializer from '../BalloonSerializer.js'

export default (data: Balloon) => BalloonSerializer(Mylar, data).attribute('color')
