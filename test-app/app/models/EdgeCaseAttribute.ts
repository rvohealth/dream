import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'

// const Decorator = new Decorators<Type<typeof EdgeCaseAttribute>>()

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
