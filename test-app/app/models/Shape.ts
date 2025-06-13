import { DreamColumn, DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

export default class Shape extends ApplicationModel {
  public override get table() {
    return 'shapes' as const
  }

  public get serializers(): DreamSerializers<Shape> {
    return {
      default: 'ShapeSerializer',
      summary: 'ShapeSummarySerializer',
    }
  }

  public id: DreamColumn<Shape, 'id'>
  public name: DreamColumn<Shape, 'name'>
  public type: DreamColumn<Shape, 'type'>
  public createdAt: DreamColumn<Shape, 'createdAt'>
  public updatedAt: DreamColumn<Shape, 'updatedAt'>
}
