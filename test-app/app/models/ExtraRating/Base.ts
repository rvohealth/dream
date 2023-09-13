import { IdType } from '../../../../src/dream/types'
import ApplicationModel from '../ApplicationModel'

export default class BaseExtraRating extends ApplicationModel {
  public get table() {
    return 'extra_ratings' as const
  }

  public id: IdType
  public body: string | null
  public rating: number | null

  public extraRateableId: IdType
  public extraRateableType: string
}
