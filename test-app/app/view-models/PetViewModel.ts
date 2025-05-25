import { DreamSerializers } from '../../../src/index.js'
import { CatTreats, IdType, Species } from '../../types/db.js'
import ApplicationModel from '../models/ApplicationModel.js'
import UserViewModel from './UserViewModel.js'

export default class PetViewModel {
  public id: IdType
  public name: string | undefined
  public user: UserViewModel | undefined
  public species: Species | undefined
  public favoriteTreats: CatTreats[]

  constructor({
    id,
    name,
    species,
    user,
    favoriteTreats = [],
  }: {
    id: IdType
    name?: string
    species?: Species
    user?: UserViewModel
    favoriteTreats?: CatTreats[]
  }) {
    this.id = id
    this.name = name
    this.species = species
    this.user = user
    this.favoriteTreats = favoriteTreats
  }

  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'view-model/PetSerializer',
      summary: 'view-model/PetSummarySerializer',
    }
  }
}
