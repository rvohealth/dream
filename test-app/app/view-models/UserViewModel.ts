import { DreamSerializers } from '../../../src/types/dream.js'
import CalendarDate from '../../../src/utils/datetime/CalendarDate.js'
import ApplicationModel from '../models/ApplicationModel.js'
import Balloon from '../models/Balloon.js'
import PetViewModel from './PetViewModel.js'

export default class UserViewModel {
  public id: string
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
    id: string
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
