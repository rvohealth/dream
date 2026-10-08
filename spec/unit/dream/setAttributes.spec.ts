import DoNotSetEncryptedFieldsDirectly from '../../../src/errors/DoNotSetEncryptedFieldsDirectly.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#setAttributes', () => {
  it('writes the values as given, bypassing custom setters', () => {
    const pet = Pet.new()
    pet.setAttributes({ nickname: 'Jasper' })
    expect(pet.nickname).toEqual('Jasper')
  })

  it('encrypts a value given for an encrypted property', () => {
    const user = User.new()

    user.setAttributes({ secret: 'shh' })

    expect(user.getAttribute('encryptedSecret')).not.toEqual('shh')
    expect(user.secret).toEqual('shh')
  })

  context('with an @Encrypted backing column', () => {
    it('accepts ciphertext the app can decrypt', () => {
      const ciphertext = User.new({ secret: 'copied secret' }).getAttribute('encryptedSecret')
      const user = User.new()

      user.setAttributes({ encryptedSecret: ciphertext })

      expect(user.secret).toEqual('copied secret')
    })

    it('accepts null, clearing the column', () => {
      const user = User.new({ secret: 'original' })

      user.setAttributes({ encryptedSecret: null })

      expect(user.secret).toBeNull()
    })

    it('rejects plaintext, leaving the column unchanged', () => {
      const user = User.new({ secret: 'original' })

      expect(() => user.setAttributes({ encryptedSecret: 'plaintext' })).toThrow(
        DoNotSetEncryptedFieldsDirectly
      )
      expect(user.secret).toEqual('original')
    })
  })
})
