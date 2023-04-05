import HasMany from '../../../associations/has-many'
import HasOne from '../../../associations/has-one'
import { Column } from '../../../decorators/column'
import dream from '../../../dream'
import Composition from './composition'
import CompositionAsset from './composition-asset'

const Dream = dream('users')
export default class User extends Dream {
  @Column('number')
  public id: number

  @Column('string')
  public email: string

  @Column('string')
  public name: string

  @Column('string')
  public password: string

  @HasMany('compositions', () => Composition)
  public compositions: Composition[]

  @HasMany('composition_assets', () => CompositionAsset, { through: () => Composition })
  public compositionAssets: CompositionAsset[]

  @HasOne('compositions', () => Composition)
  public mainComposition: Composition
}
