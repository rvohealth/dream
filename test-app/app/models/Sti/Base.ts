import { DreamColumn, DreamSerializers } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'

// const deco = new Decorators<typeof StiBase>()

export default class StiBase extends ApplicationModel {
  public override get table() {
    return 'sti_bases' as const
  }

  public get serializers(): DreamSerializers<StiBase> {
    return {
      default: 'Sti/BaseSerializer',
      summary: 'Sti/BaseSummarySerializer',
    }
  }

  public id: DreamColumn<StiBase, 'id'>
  public type: DreamColumn<StiBase, 'type'>
  public name: DreamColumn<StiBase, 'name'>
  public createdAt: DreamColumn<StiBase, 'createdAt'>
  public updatedAt: DreamColumn<StiBase, 'updatedAt'>
}
