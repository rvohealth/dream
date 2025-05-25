import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import Composition from '../models/Composition.js'

export default (data: Composition) =>
  DreamSerializer(Composition, data)
    .attribute('id')
    .jsonAttribute('metadata', { openapi: 'json' })

    .rendersMany('compositionAssets')
    // .rendersMany('localizedTexts', () => LocalizedTextBaseSerializer<any>)

    .rendersOne('passthroughCurrentLocalizedText')
