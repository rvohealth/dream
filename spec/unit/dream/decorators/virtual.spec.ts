import User from '../../../../test-app/app/models/User.js'

describe('@deco.Virtual', () => {
  it('adds the decorated property to the defaultParamSafeColumns', () => {
    expect(User['defaultParamSafeColumns']()).toEqual(expect.arrayContaining(['password']))
  })

  it('adds the virtual columns to the Dream class’s virtualAttributes', () => {
    expect(User['virtualAttributes']).toEqual(expect.arrayContaining([{ property: 'password' }]))
  })

  it('allows the decorated property to be passed into #new as if it were a column on the database', () => {
    const user = User.new({ password: 's3cr3t!' })
    expect(user.password).toEqual('s3cr3t!')
  })

  it('allows properties with no getter-setter pattern to behave', () => {
    const user = User.new({ randoVirtual: 'abc' })
    expect(user.randoVirtual).toEqual('abc')
  })

  it('can decorate getter properties', () => {
    const user = User.new({ lbs: 180.1 })
    expect(user.lbs).toEqual(180.1)
    expect(user.getAttribute('grams')).toEqual(81693)
  })

  it('can decorate setter properties', () => {
    const user = User.new({ kilograms: 90.2 })
    expect(user.kilograms).toEqual(90.2)
    expect(user.getAttribute('grams')).toEqual(90200)
  })
})
