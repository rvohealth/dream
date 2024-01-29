import Composition from '../../../test-app/app/models/Composition'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset'
import LocalizedText from '../../../test-app/app/models/LocalizedText'
import User from '../../../test-app/app/models/User'

describe('Dream.loadInto', () => {
  it('loads the specified association into the models', async () => {
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

    await Composition.loadInto([composition, compositionAsset], 'localizedTexts')
    expect(composition.localizedTexts).toMatchDreamModels([compositionText1, compositionText2])
    expect(compositionAsset.localizedTexts).toMatchDreamModels([compositionAssetText1, compositionAssetText2])
  })

  // this is skipped, since it is only here to ensure that types are working
  // from args a-g, which does not actually need to be run, since if this is
  // broken, tests will fail to compile due to type errors
  it.skip('permits types a-g', async () => {
    await Composition.loadInto([], 'user', 'balloons', 'user', 'balloons', 'user', 'balloons')
  })
})
