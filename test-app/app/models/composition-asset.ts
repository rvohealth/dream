import BelongsTo from '../../../src/decorators/associations/belongs-to'
import HasMany from '../../../src/decorators/associations/has-many'
import HasOne from '../../../src/decorators/associations/has-one'
import { Column } from '../../../src/decorators/column'
import AfterDestroy from '../../../src/decorators/hooks/after-destroy'
import BeforeDestroy from '../../../src/decorators/hooks/before-destroy'
import BeforeSave from '../../../src/decorators/hooks/before-save'
import dream from '../../../src/dream'
import Composition from './composition'
import CompositionAssetAudit from './composition-asset-audit'
import User from './user'

const Dream = dream('composition_assets')
export default class CompositionAsset extends Dream {
  @Column('number')
  public id: number

  @Column('number')
  public composition_id: number

  @Column('string')
  public src: string | null

  @Column('boolean')
  public primary: boolean

  @BelongsTo(() => Composition)
  public composition: Composition

  @HasOne(() => User, {
    through: 'composition',
    throughClass: () => Composition,
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
}
