import Decorators from '../../../../src/decorators/Decorators.js'
import { DreamConst } from '../../../../src/dream/constants.js'
import { DreamColumn, DreamSerializers } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import CircularReferenceLocalizedText from './LocalizedText.js'
import ModelB from './ModelB.js'

const deco = new Decorators<typeof ModelA>()

export default class ModelA extends ApplicationModel {
  public override get table() {
    return 'circular_reference_model_as' as const
  }

  public get serializers(): DreamSerializers<ModelA> {
    return {
      default: 'CircularReference/ModelASerializer',
      summary: 'CircularReference/ModelASummarySerializer',
    }
  }

  public id: DreamColumn<ModelA, 'id'>
  public createdAt: DreamColumn<ModelA, 'createdAt'>
  public updatedAt: DreamColumn<ModelA, 'updatedAt'>

  @deco.HasOne('CircularReference/ModelB')
  public modelBChild: ModelB

  @deco.HasOne('CircularReference/ModelB')
  public modelBChild2: ModelB

  @deco.BelongsTo('CircularReference/ModelB', { optional: true })
  public modelBParent: ModelB
  public circularReferenceModelBId: DreamColumn<ModelA, 'circularReferenceModelBId'>

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
  public async createDefaultLocalizedText(this: ModelA) {
    this.currentLocalizedText = await this.createAssociation('localizedTexts', {
      locale: 'en-US',
      title: `This is ModelA ${this.id}`,
    })
  }
}
