import STI from '../../../../src/decorators/class/STI.js'
import Balloon from '../Balloon.js'

@STI(Balloon)
export default class Mylar extends Balloon {}
