import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

// const deco = new Decorators<typeof EdgeCaseAttribute>()

export default class EdgeCaseAttribute extends ApplicationModel {
  public override get table() {
    return 'edge_case_attributes' as const
  }

  public get serializers(): DreamSerializers<EdgeCaseAttribute> {
    return { default: 'EdgeCaseAttributeSerializer' }
  }

  public id: DreamColumn<EdgeCaseAttribute, 'id'>
  public kPop: DreamColumn<EdgeCaseAttribute, 'kPop'>
  public popK: DreamColumn<EdgeCaseAttribute, 'popK'>
  public popKPop: DreamColumn<EdgeCaseAttribute, 'popKPop'>
  public createdAt: DreamColumn<EdgeCaseAttribute, 'createdAt'>
  public updatedAt: DreamColumn<EdgeCaseAttribute, 'updatedAt'>
}
