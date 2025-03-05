import User from '../../../../test-app/app/models/User'

describe('@Encrypted', () => {
  context('with no arguments', () => {
    it('uses the word "encrypted" in front of the pascalized method name', () => {
      expect(User['encryptedAttributes']).toEqual([
        {
          property: 'secret',
          encryptedColumnName: 'encryptedSecret',
        },
        {
          property: 'otherSecret',
          encryptedColumnName: 'myOtherEncryptedSecret',
        },
      ])

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
