import Pet from '../../../../test-app/app/models/Pet'

describe('marshalling postgres arrays from db', () => {
  it('converts stored postgres array data into proper array type', async () => {
    const pet = await Pet.create({
      favorite_treats: ['chicken', 'tuna', 'cat-safe chalupas (catlupas,supaloopas)'],
    })
    expect(pet.favorite_treats).toEqual(['chicken', 'tuna', 'cat-safe chalupas (catlupas,supaloopas)'])
  })
})
