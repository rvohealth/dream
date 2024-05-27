import BelongsTo from '../../../src/decorators/associations/belongs-to'
import { DreamColumn } from '../../../src/dream/types'
import CollarSerializer from '../../../test-app/app/serializers/CollarSerializer'
import Pet from './Pet'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'
import Scope from '../../../src/decorators/scope'
import Query from '../../../src/dream/query'

export default class Collar extends ApplicationModel {
  public get table() {
    return 'collars' as const
  }

  public get serializers() {
    return { default: CollarSerializer } as const
  }

  public id: DreamColumn<Collar, 'id'>
  public lost: DreamColumn<Collar, 'lost'>
  public tagName: DreamColumn<Collar, 'tagName'>
  public createdAt: DreamColumn<Collar, 'createdAt'>
  public updatedAt: DreamColumn<Collar, 'updatedAt'>

  @Collar.Sortable({ scope: ['pet', 'tagName'] })
  public position: DreamColumn<Collar, 'position'>

  @BelongsTo(() => Pet)
  public pet: Pet
  public petId: DreamColumn<Collar, 'petId'>

  @BelongsTo(() => Balloon, { foreignKey: 'balloonId', optional: true })
  public balloon: Balloon
  public balloonId: DreamColumn<Collar, 'balloonId'>

  @Scope({ default: true })
  public static hideHiddenCollars(query: Query<Collar>) {
    return query.where({ hidden: false })
  }
}
