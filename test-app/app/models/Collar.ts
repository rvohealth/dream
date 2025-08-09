import Query from '../../../src/dream/Query.js'
import { Decorators, SoftDelete } from '../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'
import Balloon from './Balloon.js'
import Pet from './Pet.js'

const deco = new Decorators<typeof Collar>()

@SoftDelete()
export default class Collar extends ApplicationModel {
  public override get table() {
    return 'collars' as const
  }

  public get serializers(): DreamSerializers<Collar> {
    return {
      default: 'CollarSerializer',
      summary: 'CollarSummarySerializer',
      deep: 'CollarDeepSerializer',
    } as const
  }

  public id: DreamColumn<Collar, 'id'>
  public lost: DreamColumn<Collar, 'lost'>
  public tagName: DreamColumn<Collar, 'tagName'>
  public createdAt: DreamColumn<Collar, 'createdAt'>
  public updatedAt: DreamColumn<Collar, 'updatedAt'>

  @deco.Sortable({ scope: ['pet', 'tagName'] })
  public position: DreamColumn<Collar, 'position'>

  @deco.Sortable({ scope: 'balloon' })
  public positionOnBalloon: DreamColumn<Collar, 'positionOnBalloon'>

  @deco.Sortable({ scope: ['balloon', 'pet'] })
  public positionOnBalloonAndPet: DreamColumn<Collar, 'positionOnBalloonAndPet'>

  @deco.BelongsTo('Pet')
  public pet: Pet
  public petId: DreamColumn<Collar, 'petId'>

  @deco.BelongsTo('Balloon', { foreignKey: 'balloonId', optional: true })
  public balloon: Balloon
  public balloonId: DreamColumn<Collar, 'balloonId'>

  @deco.Scope({ default: true })
  public static hideHiddenCollars(query: Query<Collar>) {
    return query.where({ hidden: false })
  }
}
