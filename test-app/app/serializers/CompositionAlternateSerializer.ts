import { DreamSerializer } from '../../../src/serializer/index.js'
import Composition from '../models/Composition.js'

// Since this serializer's name is different from the model it is related to,
// dream will not be able to infer the origin model, and will fail to lookup serializers
// that aren't explicitly specified or else given a lookup path.
const CompositionAlternateSerializer = ($data: Composition) =>
  DreamSerializer(Composition, $data)
    .attribute('id')
    .attribute('metadata', 'json')
    .rendersMany('compositionAssets')
    // .rendersMany('localizedTexts', () => LocalizedTextBaseSerializer<any>)

    // intentionally omitting the serializer callback to
    // explicitly test importing from only a path config
    .rendersOne('passthroughCurrentLocalizedText', {
      path: 'LocalizedText/BaseSerializer',
      exportedAs: 'LocalizedTextBaseSerializer',
    })

export default CompositionAlternateSerializer
