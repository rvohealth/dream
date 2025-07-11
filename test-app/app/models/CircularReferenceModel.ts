import { Decorators } from '../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof CircularReferenceModel>()

export default class CircularReferenceModel extends ApplicationModel {
  public override get table() {
    return 'circular_reference_models' as const
  }

  public get serializers(): DreamSerializers<CircularReferenceModel> {
    return {
      default: 'CircularReferenceModelSerializer',
      summary: 'CircularReferenceModelSummarySerializer',
    }
  }

  public id: DreamColumn<CircularReferenceModel, 'id'>
  public createdAt: DreamColumn<CircularReferenceModel, 'createdAt'>
  public updatedAt: DreamColumn<CircularReferenceModel, 'updatedAt'>

  @deco.HasOne('CircularReferenceModel', { foreignKey: 'parentId' })
  public child: CircularReferenceModel

  @deco.BelongsTo('CircularReferenceModel', { foreignKey: 'parentId', optional: true })
  public parent: CircularReferenceModel
  public parentId: DreamColumn<CircularReferenceModel, 'parentId'>
}
