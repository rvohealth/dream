import { Decorators, DreamConst } from '../../../../src/index.js'
import { DreamColumn, DreamSerializers } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import CircularReferenceLocalizedText from './LocalizedText.js'
import ModelA from './ModelA.js'

const deco = new Decorators<typeof ModelB>()

export default class ModelB extends ApplicationModel {
  public override get table() {
    return 'circular_reference_model_bs' as const
  }

  public get serializers(): DreamSerializers<ModelB> {
    return {
      default: 'CircularReference/ModelBSerializer',
      summary: 'CircularReference/ModelBSummarySerializer',
    }
  }

  public id: DreamColumn<ModelB, 'id'>
  public createdAt: DreamColumn<ModelB, 'createdAt'>
  public updatedAt: DreamColumn<ModelB, 'updatedAt'>

  @deco.HasOne('CircularReference/ModelA')
  public modelAChild: ModelA

  @deco.BelongsTo('CircularReference/ModelA', { optional: true })
  public modelAParent: ModelA
  public circularReferenceModelAId: DreamColumn<ModelB, 'circularReferenceModelAId'>

  @deco.HasMany('CircularReference/LocalizedText', {
    polymorphic: true,
    on: 'localizableId',
  })
  public localizedTexts: CircularReferenceLocalizedText[]

  @deco.HasOne('CircularReference/LocalizedText', {
    polymorphic: true,
    on: 'localizableId',
    and: { locale: DreamConst.passthrough },
  })
  public currentLocalizedText: CircularReferenceLocalizedText

  @deco.AfterCreate()
  public async createDefaultLocalizedText(this: ModelB) {
    this.currentLocalizedText = await this.createAssociation('localizedTexts', {
      locale: 'en-US',
      title: `This is ModelB ${this.id}`,
    })
  }
}
