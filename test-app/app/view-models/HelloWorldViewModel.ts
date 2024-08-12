import UserSerializer from '../serializers/UserSerializer'

export default class HelloWorldViewModel {
  public get serializers() {
    return {
      default: UserSerializer,
    } as const
  }
}
