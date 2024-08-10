import DreamSerializerConf from '../../../src/dream-serializer-conf'
import { DreamColumn } from '../../../src/dream/types'
import EdgeCaseAttributeSerializer from '../../../test-app/app/serializers/EdgeCaseAttributeSerializer'
import ApplicationModel from './ApplicationModel'

export default class EdgeCaseAttribute extends ApplicationModel {
  public get table() {
    return 'edge_case_attributes' as const
  }

  public id: DreamColumn<EdgeCaseAttribute, 'id'>
  public kPop: DreamColumn<EdgeCaseAttribute, 'kPop'>
  public popK: DreamColumn<EdgeCaseAttribute, 'popK'>
  public popKPop: DreamColumn<EdgeCaseAttribute, 'popKPop'>
  public createdAt: DreamColumn<EdgeCaseAttribute, 'createdAt'>
  public updatedAt: DreamColumn<EdgeCaseAttribute, 'updatedAt'>
}

DreamSerializerConf.add(EdgeCaseAttribute, { default: EdgeCaseAttributeSerializer<any> })
