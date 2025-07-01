import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import User from '../../../test-app/app/models/User.js'
import BalloonSerializer from '../../../test-app/app/serializers/BalloonSerializer.js'

describe('Dream.lookup', () => {
  it('imports models', () => {
    expect(ApplicationModel.lookup('User')).toEqual(User)
  })

  it('imports serilaizers', () => {
    expect(ApplicationModel.lookup('BalloonSerializer')).toEqual(BalloonSerializer)
  })
})
