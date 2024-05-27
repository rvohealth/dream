import { DreamColumn } from '../../../../src/dream/types'
import ApplicationModel from '../ApplicationModel'

export default class BaseExtraRating extends ApplicationModel {
  public get table() {
    return 'extra_ratings' as const
  }

  public id: DreamColumn<BaseExtraRating, 'id'>
  public body: DreamColumn<BaseExtraRating, 'body'>
  public rating: DreamColumn<BaseExtraRating, 'rating'>

  public extraRateableId: DreamColumn<BaseExtraRating, 'extraRateableId'>
  public extraRateableType: DreamColumn<BaseExtraRating, 'extraRateableType'>
}
