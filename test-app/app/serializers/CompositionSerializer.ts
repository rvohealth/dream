import { DreamModelSerializer } from '../../../src/serializer/index.js'
import Composition from '../models/Composition.js'

const CompositionSerializer = ($data: Composition) =>
  DreamModelSerializer(Composition, $data)
    .attribute('id')
    .attribute('metadata', 'json')

    .rendersMany('compositionAssets')
    // .rendersMany('localizedTexts', () => LocalizedTextBaseSerializer<any>)

    .rendersOne('passthroughCurrentLocalizedText')

export default CompositionSerializer
