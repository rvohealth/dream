import Balloon from '../../../../test-app/app/models/Balloon.js'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import User from '../../../../test-app/app/models/User.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

/**
 * Every model is globally initialized exactly once at boot, in the order the
 * model files are read off the filesystem, so an STI base may be initialized
 * before its children (`CoachTip/Base.ts` before `CoachTip/Video.ts`) or after
 * them (`Balloon/Latex.ts` before `Balloon.ts`). Re-initializing base-first
 * here reproduces the base-before-child order.
 */
describe('@Sortable on an STI base initialized before its children', () => {
  let user: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    processDynamicallyDefinedModels(Balloon, Latex, Animal)
  })

  it('registers each sortable field on the child exactly once', () => {
    expect(Latex['sortableFields'].map(conf => conf.positionField)).toEqual(['positionAlpha', 'positionBeta'])

    expect(Animal['sortableFields'].map(conf => conf.positionField)).toEqual([
      'positionAlpha',
      'positionBeta',
    ])
  })

  it('positions newly created STI children contiguously from 1', async () => {
    const balloon1 = await Latex.create({ user })
    const balloon2 = await Latex.create({ user })

    expect(balloon1.positionAlpha).toEqual(1)
    expect(balloon2.positionAlpha).toEqual(2)
    expect(balloon1.positionBeta).toEqual(1)
    expect(balloon2.positionBeta).toEqual(2)
  })
})
