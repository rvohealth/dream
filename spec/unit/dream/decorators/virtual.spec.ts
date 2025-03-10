import User from '../../../../test-app/app/models/User'

describe('@Virtual', () => {
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
})
