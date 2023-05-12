import ValidationError from '../../../../src/exceptions/validation-error'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import User from '../../../../test-app/app/models/User'

describe('Dream presence numericality', () => {
  it('appplies validation configuration to dream class', async () => {
    const validation = Mylar.validations.find(v => v.column === 'volume' && v.type === 'numericality')!
    expect(validation.type).toEqual('numericality')
    expect(validation.column).toEqual('volume')
  })

  it('prevents saving when a field requiring numericality is not a number', async () => {
    const user = await User.create({ email: 'fred@', password: 'howyadoin' })
    const balloon = Mylar.new({ user, volume: 'not valid' })
    expect(balloon.isInvalid).toEqual(true)

    await expect(balloon.save()).rejects.toThrowError(ValidationError)

    expect(balloon.isPersisted).toEqual(false)
    expect(await Mylar.count()).toEqual(0)
    expect(balloon.errors.volume).toContain('numericality')
  })
})
