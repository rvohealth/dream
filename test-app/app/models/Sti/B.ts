import STI from '../../../../src/decorators/class/STI.js'
import { DreamSerializers } from '../../../../src/types/dream.js'
import StiBase from './Base.js'

@STI(StiBase)
export default class StiB extends StiBase {
  public override get serializers(): DreamSerializers<StiB> {
    return {
      default: 'Sti/BSerializer',
      summary: 'Sti/BSummarySerializer',
    }
  }
}
