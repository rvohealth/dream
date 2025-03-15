import { DreamColumn, DreamSerializers } from '../../../src/dream/types.js'
import ApplicationModel from './ApplicationModel.js'

// const Deco = new Decorators<InstanceType<typeof EdgeCaseAttribute>>()

export default class EdgeCaseAttribute extends ApplicationModel {
  public get table() {
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
