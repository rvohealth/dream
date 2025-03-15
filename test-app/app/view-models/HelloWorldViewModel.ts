import { DreamSerializers } from '../../../src/index.js'
import ApplicationModel from '../models/ApplicationModel.js'

export default class HelloWorldViewModel {
  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'UserSerializer',
    }
  }
}
