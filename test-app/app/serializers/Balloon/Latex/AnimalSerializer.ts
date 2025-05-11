import Balloon from '../../../models/Balloon.js'
import Animal from '../../../models/Balloon/Latex/Animal.js'
import BalloonSerializer from '../../BalloonSerializer.js'

export default (data: Balloon) => BalloonSerializer(Animal, data).attribute('color')
