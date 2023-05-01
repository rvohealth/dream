import { HasOne } from '../../../src'
import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import AfterCreate from '../../../src/decorators/hooks/after-create'
import AfterCreateCommit from '../../../src/decorators/hooks/after-create-commit'
import AfterSave from '../../../src/decorators/hooks/after-save'
import AfterSaveCommit from '../../../src/decorators/hooks/after-save-commit'
import AfterUpdate from '../../../src/decorators/hooks/after-update'
import AfterUpdateCommit from '../../../src/decorators/hooks/after-update-commit'
import BeforeCreate from '../../../src/decorators/hooks/before-create'
import Dream from '../../../src/dream'
import CompositionAsset from './composition-asset'
import CompositionAssetAudit from './composition-asset-audit'
import User from './user'

export default class Composition extends Dream {
  public get table() {
    return 'compositions' as const
  }

  public id: number
  public content: string | null

  @BelongsTo(() => User)
  public user: User
  public user_id: number

  @HasMany(() => CompositionAsset)
  public compositionAssets: CompositionAsset[]

  @HasOne(() => CompositionAsset, {
    where: { primary: true },
  })
  public mainCompositionAsset: CompositionAsset

  @HasMany(() => CompositionAssetAudit, {
    through: 'compositionAssets',
    throughClass: () => CompositionAsset,
  })
  public compositionAssetAudits: CompositionAssetAudit[]

  @BeforeCreate()
  public setDefaultContent() {
    if (!this.content) this.content = 'default content'
  }

  @AfterCreate()
  public conditionallyChangeContentOnCreate() {
    if (this.content === 'change me after create') this.content = 'changed after create'
    if (this.content === 'change me after create commit')
      this.content = 'changed after create, but should change after create commit'
  }

  @AfterUpdate()
  public conditionallyChangeContentOnUpdate() {
    if (this.content === 'change me after update') this.content = 'changed after update'
    if (this.content === 'change me after update commit')
      this.content = 'changed after update, but should change after update commit'
  }

  @AfterSave()
  public conditionallyChangeContentOnSave() {
    if (this.content === 'change me after save') this.content = 'changed after save'
    if (this.content === 'change me after save commit')
      this.content = 'changed after save, but should change after save commit'
  }

  @AfterCreateCommit()
  public conditionallyChangeContentOnCreateCommit() {
    if (this.content === 'changed after create, but should change after create commit')
      this.content = 'changed after create commit'
  }

  @AfterUpdateCommit()
  public conditionallyChangeContentOnUpdateCommit() {
    if (this.content === 'changed after update, but should change after update commit')
      this.content = 'changed after update commit'
  }
  @AfterSaveCommit()
  public conditionallyChangeContentOnSaveCommit() {
    if (this.content === 'changed after save, but should change after save commit')
      this.content = 'changed after save commit'
  }
}
