import { Decorators } from '../../../../src/index.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../ApplicationModel.js'
import ModelA from './ModelA.js'
import ModelB from './ModelB.js'

const deco = new Decorators<typeof CircularReferenceLocalizedText>()

export default class CircularReferenceLocalizedText extends ApplicationModel {
  public override get table() {
    return 'circular_reference_localized_texts' as const
  }

  public id: DreamColumn<CircularReferenceLocalizedText, 'id'>
  public title: DreamColumn<CircularReferenceLocalizedText, 'title'>
  public markdown: DreamColumn<CircularReferenceLocalizedText, 'markdown'>
  public createdAt: DreamColumn<CircularReferenceLocalizedText, 'createdAt'>
  public updatedAt: DreamColumn<CircularReferenceLocalizedText, 'updatedAt'>

  @deco.BelongsTo(['CircularReference/ModelA', 'CircularReference/ModelB'], {
    polymorphic: true,
    foreignKey: 'localizableId',
  })
  public localizable: ModelA | ModelB
  public localizableType: DreamColumn<CircularReferenceLocalizedText, 'localizableType'>
  public localizableId: DreamColumn<CircularReferenceLocalizedText, 'localizableId'>
}
