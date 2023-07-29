import Dream from '../../../../src/dream'
import { IdType } from '../../../../src/dream/types'

export default class BaseExtraRating extends Dream {
  public get table() {
    return 'extra_ratings' as const
  }

  public id: IdType
  public body: string | null
  public rating: number | null

  public extra_rateable_id: IdType
  public extra_rateable_type: string
}
