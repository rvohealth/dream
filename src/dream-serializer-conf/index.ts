import Dream from '../dream'
import DreamSerializer from '../serializer'

interface SerializerConfig {
  dreamClass: typeof Dream
  serializers: Record<string, typeof DreamSerializer>
}

export default class DreamSerializerConf {
  public static serializerConfig: SerializerConfig[] = []

  public static add(dreamClass: typeof Dream, serializers: Record<string, typeof DreamSerializer>) {
    this.serializerConfig.push({
      dreamClass,
      serializers,
    })
  }

  public static applySerializers() {
    this.serializerConfig.forEach(({ dreamClass, serializers }) => (dreamClass.serializers = serializers))
  }
}
