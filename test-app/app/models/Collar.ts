import { DateTime } from 'luxon'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { IdType } from '../../../src/dream/types'
import CollarSerializer from '../../../test-app/app/serializers/CollarSerializer'
import Pet from './Pet'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'
import Scope from '../../../src/decorators/scope'
import Query from '../../../src/dream/query'
import { Sortable } from '../../../src'

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

  @Sortable({ scope: ['pet', 'tagName'] })
  public position: number

  @BelongsTo(() => Pet)
  public pet: Pet
  public petId: IdType

  @BelongsTo(() => Balloon, { foreignKey: 'balloonId', optional: true })
  public balloon: Balloon
  public balloonId: IdType

  @Scope({ default: true })
  public static hideHiddenCollars(query: Query<typeof Collar>) {
    return query.where({ hidden: false })
  }
}
