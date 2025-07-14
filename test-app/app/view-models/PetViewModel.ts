import { CatTreats, Species } from '../../types/db.js'
import PetSerializer, { PetSummarySerializer } from '../serializers/view-model/PetSerializer.js'
import UserViewModel from './UserViewModel.js'

export default class PetViewModel {
  public id: string
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
    id: string
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

  public get serializers() {
    return {
      default: PetSerializer,
      summary: PetSummarySerializer,
    }
  }
}
