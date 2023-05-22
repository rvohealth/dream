import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import AfterDestroy from '../../../src/decorators/hooks/after-destroy'
import AfterDestroyCommit from '../../../src/decorators/hooks/after-destroy-commit'
import BeforeDestroy from '../../../src/decorators/hooks/before-destroy'
import BeforeSave from '../../../src/decorators/hooks/before-save'
import Dream from '../../../src/dream'
import { IdType } from '../../../src/db/reflections'
import Composition from './Composition'
import CompositionAssetAudit from './CompositionAssetAudit'
import User from './User'

export default class CompositionAsset extends Dream {
  public get table() {
    return 'composition_assets' as const
  }

  public id: IdType
  public src: string | null
  public name: string | null
  public primary: boolean

  @BelongsTo(() => Composition)
  public composition: Composition
  public composition_id: IdType

  @HasOne(() => User, {
    through: 'composition',
  })
  public user: User

  @HasMany(() => CompositionAssetAudit)
  public compositionAssetAudits: CompositionAssetAudit[]

  @BeforeSave()
  public ensureDefaultSrc() {
    this.src ||= 'default src'
  }

  @BeforeDestroy()
  public async updateCompositionContentBeforeDestroy(this: CompositionAsset) {
    if (!this.composition) await this.load('composition')
    if (this.src === 'mark before destroy')
      await this.composition!.update({ content: 'something was destroyed' })
  }

  @AfterDestroy()
  public async updateCompositionContentAfterDestroy(this: CompositionAsset) {
    if (!this.composition) await this.load('composition')
    if (this.src === 'mark after destroy')
      await this.composition!.update({ content: 'changed after destroying composition asset' })
  }

  @AfterDestroyCommit()
  public async updateCompositionContentAfterDestroyCommit(this: CompositionAsset) {
    if (!this.composition) await this.load('composition')
    if (this.src === 'mark after destroy commit')
      await this.composition!.update({ content: 'changed after destroy commit of composition asset' })
  }
}
