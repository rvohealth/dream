import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { IdType } from '../../../src/dream/types'
import CollarSerializer from '../../../test-app/app/serializers/CollarSerializer'
import Pet from './Pet'
import ApplicationModel from './ApplicationModel'

export default class Collar extends ApplicationModel {
  public get table() {
    return 'collars' as const
  }

  public get serializer() {
    return CollarSerializer
  }

  public id: IdType
  public lost: boolean
  public tagName: string
  public createdAt: DateTime
  public updatedAt: DateTime

  @BelongsTo(() => Pet)
  public pet: Pet
  public petId: IdType
}
