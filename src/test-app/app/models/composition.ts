import BelongsTo from '../../../decorators/associations/belongs-to'
import HasMany from '../../../decorators/associations/has-many'
import { Column } from '../../../decorators/column'
import AfterCreate from '../../../decorators/hooks/after-create'
import AfterSave from '../../../decorators/hooks/after-save'
import AfterUpdate from '../../../decorators/hooks/after-update'
import BeforeCreate from '../../../decorators/hooks/before-create'
import BeforeSave from '../../../decorators/hooks/before-save'
import dream from '../../../dream'
import CompositionAsset from './composition-asset'
import CompositionAssetAudit from './composition-asset-audit'
import User from './user'

const Dream = dream('compositions')
export default class Composition extends Dream {
  @Column('number')
  public id: number

  @Column('number')
  public user_id: number

  @Column('string')
  public content: string | null

  @BelongsTo('users', () => User)
  public user: User

  @HasMany('composition_assets', () => CompositionAsset)
  public compositionAssets: CompositionAsset[]

  @HasMany('composition_asset_audits', () => CompositionAssetAudit, {
    through: () => CompositionAsset,
    throughKey: 'compositionAssets',
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  @BeforeCreate()
  public setDefaultContent() {
    if (!this.content) this.content = 'default content'
  }

  @AfterCreate()
  public conditionallyChangeContentOnCreate() {
    if (this.content === 'change me after create') this.content = 'changed after create'
  }

  @AfterUpdate()
  public conditionallyChangeContentOnUpdate() {
    if (this.content === 'change me after update') this.content = 'changed after update'
  }

  @AfterSave()
  public conditionallyChangeContentOnSave() {
    if (this.content === 'change me after save') this.content = 'changed after save'
  }
}
