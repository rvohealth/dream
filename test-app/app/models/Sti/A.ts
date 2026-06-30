import STI from '../../../../src/decorators/class/STI.js'
import { DreamSerializers } from '../../../../src/types/dream.js'
import StiBase from './Base.js'

@STI(StiBase)
export default class StiA extends StiBase {
  public override get serializers(): DreamSerializers<StiA> {
    return {
      default: 'Sti/ASerializer',
      summary: 'Sti/ASummarySerializer',
    }
  }
}
