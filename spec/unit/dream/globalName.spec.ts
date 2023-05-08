import Mylar from '../../../test-app/app/models/Balloon/Mylar'

describe('Dream.globalName', () => {
  it('returns the class name', async () => {
    expect(await Mylar.globalName()).toEqual('BalloonMylar')
  })
})
