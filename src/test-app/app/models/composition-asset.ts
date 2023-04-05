import BelongsTo from '../../../decorators/associations/belongs-to'
import HasMany from '../../../decorators/associations/has-many'
import { Column } from '../../../decorators/column'
import AfterDestroy from '../../../decorators/hooks/after-destroy'
import BeforeDestroy from '../../../decorators/hooks/before-destroy'
import BeforeSave from '../../../decorators/hooks/before-save'
import dream from '../../../dream'
import Composition from './composition'
import CompositionAssetAudit from './composition-asset-audit'

const Dream = dream('composition_assets')
export default class CompositionAsset extends Dream {
  @Column('number')
  public id: number

  @Column('number')
  public composition_id: number

  @Column('string')
  public src: string | null

  @BelongsTo('compositions', () => Composition)
  public composition: Composition

  @HasMany('composition_asset_audits', () => CompositionAssetAudit)
  public compositionAssetAudits: CompositionAssetAudit[]

  @BeforeSave()
  public ensureDefaultSrc() {
    this.src ||= 'default src'
  }

  @BeforeDestroy()
  public async updateCompositionContentBeforeDestroy() {
    await this.load('composition')
    if (this.src === 'mark before destroy') this.composition!.update({ content: 'something was destroyed' })
  }

  @AfterDestroy()
  public async updateCompositionContentAfterDestroy() {
    await this.load('composition')
    if (this.src === 'mark after destroy')
      this.composition!.update({ content: 'changed after destroying composition asset' })
  }
}
