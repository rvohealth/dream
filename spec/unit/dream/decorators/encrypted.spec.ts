import User from '../../../../test-app/app/models/User.js'

describe('@Encrypted', () => {
  it('adds the decorated property to the defaultParamSafeColumns', () => {
    expect(User['defaultParamSafeColumns']()).toEqual(expect.arrayContaining(['secret', 'otherSecret']))
  })

  it('omits the corresponding column from the defaultParamSafeColumns', () => {
    expect(User['defaultParamSafeColumns']()).not.toEqual(
      expect.arrayContaining(['encryptedSecret', 'myOtherEncryptedSecret'])
    )
  })

  it('persists to and restores the encrypted value from the database, leaving the attribute corresponding to the decorated property name undefined', async () => {
    const user = await User.create({ secret: 'Howdy world', email: 'a@b.com', password: 's3cr3t!' })
    const reloadedUser = await User.findOrFail(user.id)
    expect(reloadedUser.secret).toEqual('Howdy world')

    const attributes = user.getAttributes()
    expect(attributes['secret' as keyof typeof attributes]).toBeUndefined()
  })

  it('adds the encrypted columns to the Dream class’s virtualAttributes', () => {
    expect(User['virtualAttributes']).toEqual(
      expect.arrayContaining([
        { property: 'secret', type: 'string' },
        { property: 'otherSecret', type: 'string' },
      ])
    )
  })

  context('with no arguments', () => {
    it('uses the word "encrypted" in front of the pascalized method name', () => {
      const user = User.new()
      user.secret = 'shh!'
      expect(user.secret).toEqual('shh!')
      expect(user.getAttribute('encryptedSecret')).not.toEqual('shh!')
      expect(typeof user.getAttribute('encryptedSecret')).toEqual('string')
    })
  })

  context('with a field provided', () => {
    it('uses the provided field as the encryptedColumnName', () => {
      const user = User.new()
      user.otherSecret = { token: 'SHH!' }
      expect(user.otherSecret).toEqual({ token: 'SHH!' })
      expect(user.getAttribute('myOtherEncryptedSecret')).not.toEqual({ token: 'SHH!' })
      expect(typeof user.getAttribute('myOtherEncryptedSecret')).toEqual('string')
    })
  })
})
