import { CalendarDate, DreamSerializers } from '../../../src/index.js'
import { IdType } from '../../types/db.js'
import ApplicationModel from '../models/ApplicationModel.js'
import Balloon from '../models/Balloon.js'
import PetViewModel from './PetViewModel.js'

export default class UserViewModel {
  public id: IdType
  public name: string | undefined
  public birthdate: CalendarDate | undefined
  public favoriteWord: string | undefined
  public pets: PetViewModel[]
  public balloons: Balloon[]

  constructor({
    id,
    name,
    birthdate,
    favoriteWord,
    pets = [],
    balloons = [],
  }: {
    id: IdType
    name?: string | undefined
    birthdate?: CalendarDate
    favoriteWord?: string
    pets?: PetViewModel[]
    balloons?: Balloon[]
  }) {
    this.id = id
    this.name = name
    this.birthdate = birthdate
    this.favoriteWord = favoriteWord
    this.pets = pets
    this.balloons = balloons
  }

  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'view-model/UserSerializer',
      summary: 'view-model/UserSummarySerializer',
    }
  }
}
