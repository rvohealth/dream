import { DreamSerializers } from '../../../src'
import ApplicationModel from '../models/ApplicationModel'

export default class HelloWorldViewModel {
  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'UserSerializer',
    }
  }
}
