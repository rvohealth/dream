import DreamApp from '../../../src/dream-app/index.js'
import virtualAttributeNames from '../../../src/helpers/virtualAttributeNames.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('virtualAttributeNames', () => {
  it('is reachable through DreamApp.system', () => {
    expect(DreamApp.system.virtualAttributeNames).toBe(virtualAttributeNames)
  })

  it('names the @deco.Virtual and @deco.Encrypted attributes of a model, in the order Dream registered them', () => {
    expect(virtualAttributeNames(User)).toEqual([
      'lbs',
      'kilograms',
      'secret',
      'otherSecret',
      'password',
      'randoVirtual',
    ])
  })

  it('is empty for a model that declares none', () => {
    expect(virtualAttributeNames(Pet)).toEqual([])
  })
})
