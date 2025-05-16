import { DreamSerializer } from '../../../src/serializer/index.js'
import Composition from '../models/Composition.js'

const CompositionSerializer = ($data: Composition) =>
  DreamSerializer(Composition, $data)
    .attribute('id')
    .jsonAttribute('metadata', 'json')

    .rendersMany('compositionAssets')
    // .rendersMany('localizedTexts', () => LocalizedTextBaseSerializer<any>)

    .rendersOne('passthroughCurrentLocalizedText')

export default CompositionSerializer
