import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import User from '../../../test-app/app/models/User'

describe('Dream.globalName', () => {
  it('returns the class name', async () => {
    expect(await User.globalName()).toEqual('User')
  })

  context('with a nested class', () => {
    it('combines the path parts together to make a global-safe version of the class', async () => {
      expect(await Mylar.globalName()).toEqual('BalloonMylar')
    })
  })

  context('with ApplicationModel', () => {
    it('returns undefined', async () => {
      expect(await ApplicationModel.globalName()).toBeUndefined()
    })
  })
})
