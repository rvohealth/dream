import Pet from '../../../../test-app/app/models/Pet'

describe('getter override', () => {
  it('overrides the automatically set getter', async () => {
    const petWithNickname = await Pet.create({ name: 'Aster', nickname: 'Polly' })
    expect(petWithNickname.nickname).toEqual('Polly')

    const petWithoutNickname = await Pet.create({ name: 'Aster' })
    expect(petWithoutNickname.nickname).toEqual('Aster')
  })
})
