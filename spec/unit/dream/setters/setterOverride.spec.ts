import Pet from '../../../../test-app/app/models/Pet.js'

describe('setter override', () => {
  it('overrides the automatically set getter', async () => {
    const pet = await Pet.create({ name: 'Aster', nickname: 'Polly' })
    expect(pet.nickname).toEqual('Li’l Polly')

    pet.nickname = 'Jasper'

    expect(pet.nickname).toEqual('Li’l Jasper')
  })
})
