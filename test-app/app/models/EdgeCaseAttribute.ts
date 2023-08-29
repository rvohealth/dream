import { DateTime } from 'luxon'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/dream/types'
import EdgeCaseAttributeSerializer from '../../../test-app/app/serializers/EdgeCaseAttributeSerializer'

export default class EdgeCaseAttribute extends Dream {
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
