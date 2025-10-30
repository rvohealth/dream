import { DreamSerializers } from '../../../src/types/dream.js'
import ApplicationModel from '../models/ApplicationModel.js'

export default class HelloWorldViewModel {
  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'UserSerializer',
    }
  }
}
