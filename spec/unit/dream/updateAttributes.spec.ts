import User from '../../../test-app/app/models/User'
import Animal from '../../../test-app/app/models/Balloon/Latex/Animal'
import Latex from '../../../test-app/app/models/Balloon/Latex'

describe('Dream#updateAttributes', () => {
  context('STI', () => {
    context('when updating the type field on an STI record', () => {
      it('bypasses user-defined setters, ensuring that the update happens', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const balloon = await Animal.create({ user })
        expect(balloon.type).toEqual('Animal')

        await balloon.updateAttributes({ type: 'Latex' })
        const reloaded = await Latex.find(balloon.id)
        expect(reloaded!.type).toEqual('Latex')
      })
    })
  })
})
