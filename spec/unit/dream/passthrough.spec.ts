import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import LocalizedText from '../../../test-app/app/models/LocalizedText'

describe('Dream.passthrough', () => {
  it('sets up the passthrough data to be used by passthrough where clauses on associations', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

    const composition = await Composition.create({ user })
    const compositionText1 = await LocalizedText.create({ localizable: composition, locale: 'en-US' })
    const compositionText2 = await LocalizedText.create({ localizable: composition, locale: 'es-ES' })

    const reloadedUser = await User.passthrough({ locale: 'es-ES' })
      .preload('compositions', 'currentLocalizedText')
      .first()
    expect(reloadedUser!.compositions[0].currentLocalizedText).toMatchDreamModel(compositionText2)
  })

  context('in a transaction', () => {
    it('sets up the passthrough data to be used by passthrough where clauses on associations', async () => {
      await ApplicationModel.transaction(async txn => {
        const user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })

        const composition = await Composition.txn(txn).create({ user })
        const compositionText1 = await LocalizedText.txn(txn).create({
          localizable: composition,
          locale: 'en-US',
        })
        const compositionText2 = await LocalizedText.txn(txn).create({
          localizable: composition,
          locale: 'es-ES',
        })

        const reloadedUser = await User.txn(txn)
          .passthrough({ locale: 'es-ES' })
          .preload('compositions', 'currentLocalizedText')
          .first()
        expect(reloadedUser!.compositions[0].currentLocalizedText).toMatchDreamModel(compositionText2)
      })
    })
  })
})

describe('Dream#passthrough', () => {
  it('sets up the passthrough data to be used by passthrough where clauses on associations', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

    const composition = await Composition.create({ user })
    const compositionText1 = await LocalizedText.create({ localizable: composition, locale: 'en-US' })
    const compositionText2 = await LocalizedText.create({ localizable: composition, locale: 'es-ES' })

    const reloadedUser = await user
      .passthrough({ locale: 'es-ES' })
      .load('compositions', 'currentLocalizedText')
      .execute()
    expect(reloadedUser!.compositions[0].currentLocalizedText).toMatchDreamModel(compositionText2)
  })
})
