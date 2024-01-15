import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import LocalizedText from '../../../test-app/app/models/LocalizedText'

describe('Query#passthrough', () => {
  context('preload', () => {
    it(
      "works in combination with association `where` clauses defined with 'passthrough' to " +
        'limit what is loaded to models that match the passthrough',
      async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const composition = await Composition.create({ user })
        const compositionText1 = await LocalizedText.create({ localizable: composition, locale: 'en-US' })
        const compositionText2 = await LocalizedText.create({ localizable: composition, locale: 'es-ES' })

        const compositionAsset = await CompositionAsset.create({ composition })
        const compositionAssetText1 = await LocalizedText.create({
          localizable: compositionAsset,
          locale: 'es-ES',
        })
        const compositionAssetText2 = await LocalizedText.create({
          localizable: compositionAsset,
          locale: 'en-US',
        })

        const reloadedUser = await User.query()
          .passthrough({ locale: 'es-ES' })
          .preload('compositions', 'currentLocalizedText')
          .preload('compositions', 'compositionAssets', 'currentLocalizedText')
          .first()
        expect(reloadedUser!.compositions[0].currentLocalizedText).toMatchDreamModel(compositionText2)
        expect(reloadedUser!.compositions[0].compositionAssets[0].currentLocalizedText).toMatchDreamModel(
          compositionAssetText1
        )
      }
    )
  })
})
