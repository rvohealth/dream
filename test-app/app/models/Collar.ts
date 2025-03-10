import { Decorators, SoftDelete } from '../../../src'
import Scope from '../../../src/decorators/Scope'
import Query from '../../../src/dream/Query'
import { DreamColumn, DreamSerializers } from '../../../src/dream/types'
import ApplicationModel from './ApplicationModel'
import Balloon from './Balloon'
import Pet from './Pet'

const Deco = new Decorators<InstanceType<typeof Collar>>()

@SoftDelete()
export default class Collar extends ApplicationModel {
  public get table() {
    return 'collars' as const
  }

  public get serializers(): DreamSerializers<Collar> {
    return { default: 'CollarSerializer' }
  }

  public id: DreamColumn<Collar, 'id'>
  public lost: DreamColumn<Collar, 'lost'>
  public tagName: DreamColumn<Collar, 'tagName'>
  public createdAt: DreamColumn<Collar, 'createdAt'>
  public updatedAt: DreamColumn<Collar, 'updatedAt'>

  @Deco.Sortable({ scope: ['pet', 'tagName'] })
  public position: DreamColumn<Collar, 'position'>

  @Deco.BelongsTo('Pet')
  public pet: Pet
  public petId: DreamColumn<Collar, 'petId'>

  @Deco.BelongsTo('Balloon', { foreignKey: 'balloonId', optional: true })
  public balloon: Balloon
  public balloonId: DreamColumn<Collar, 'balloonId'>

  @Scope({ default: true })
  public static hideHiddenCollars(query: Query<Collar>) {
    return query.where({ hidden: false })
  }
}
