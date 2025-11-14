import STI from '../../../../src/decorators/class/STI.js'
import Decorators from '../../../../src/decorators/Decorators.js'
import { DreamColumn, DreamSerializers } from '../../../../src/types/dream.js'
import Pet from '../Pet.js'
import StiBase from './Base.js'

const deco = new Decorators<typeof StiA>()

@STI(StiBase)
export default class StiA extends StiBase {
  public override get serializers(): DreamSerializers<StiA> {
    return {
      default: 'Sti/ASerializer',
      summary: 'Sti/ASummarySerializer',
    }
  }

  @deco.BelongsTo('Pet', { on: 'petId' })
  public pet: Pet
  public petId: DreamColumn<StiA, 'petId'>
}
