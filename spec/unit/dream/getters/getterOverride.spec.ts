import Balloon from '../../../../test-app/app/models/Balloon'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal'
import Pet from '../../../../test-app/app/models/Pet'
import User from '../../../../test-app/app/models/User'

describe('getter override', () => {
  it('overrides the automatically set getter', async () => {
    const petWithNickname = await Pet.create({ name: 'Aster', nickname: 'Polly' })
    expect(petWithNickname.nickname).toEqual('Li’l Polly')

    const petWithoutNickname = await Pet.create({ name: 'Aster' })
    expect(petWithoutNickname.nickname).toEqual('Aster')
  })

  context('with an STI type field override', () => {
    it('leverages getter/setter overrides', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const balloon = await Latex.create({ user })

      await balloon.update({ type: 'Animal' })
      let animal = await Animal.find(balloon.id)

      await animal!.update({ type: 'Latex' })
      animal = await Animal.find(animal!.id)

      expect(animal!.type).toEqual('Animal')
    })
  })
})
