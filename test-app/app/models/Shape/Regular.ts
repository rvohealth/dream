import STI from '../../../../src/decorators/class/STI.js'
import Shape from '../Shape.js'

@STI(Shape)
export default class RegularShape extends Shape {}
