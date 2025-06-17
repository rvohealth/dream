import Mylar from '../../models/Balloon/Mylar.js'
import BalloonSerializer from '../BalloonSerializer.js'

export default (data: Mylar) => BalloonSerializer(Mylar, data).attribute('mylarOnlyProperty')
