import { DateTime } from 'luxon'
import { IdType } from '../../../src/dream/types'
import EdgeCaseAttributeSerializer from '../../../test-app/app/serializers/EdgeCaseAttributeSerializer'
import ApplicationModel from './ApplicationModel'

export default class EdgeCaseAttribute extends ApplicationModel {
  public get table() {
    return 'edge_case_attributes' as const
  }

  public get serializer() {
    return EdgeCaseAttributeSerializer<any>
  }

  public id: IdType
  public kPop: boolean
  public popK: string
  public popKPop: number
  public createdAt: DateTime
  public updatedAt: DateTime
}
