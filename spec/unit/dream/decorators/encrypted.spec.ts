import Decorators from '../../../../src/decorators/Decorators.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import User from '../../../../test-app/app/models/User.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

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

  it("adds the encrypted columns to the Dream class's virtualAttributes with nullability based on the backing column", () => {
    expect(User['virtualAttributes']).toEqual(
      expect.arrayContaining([{ property: 'secret', type: ['string', 'null'] }])
    )
  })

  it("adds a declared openapi shape to the Dream class's virtualAttributes in place of the string default", () => {
    expect(User['virtualAttributes']).toEqual(
      expect.arrayContaining([
        {
          property: 'otherSecret',
          type: { type: ['object', 'null'], properties: { token: 'string' }, required: ['token'] },
        },
      ])
    )
  })

  it("adds each backing column to the Dream class's encryptedAttributes", () => {
    expect(User['encryptedAttributes']).toEqual(
      expect.arrayContaining([
        { property: 'secret', encryptedColumnName: 'encryptedSecret' },
        { property: 'otherSecret', encryptedColumnName: 'myOtherEncryptedSecret' },
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

  context('with a column provided in the options', () => {
    it('uses the provided column as the encryptedColumnName', () => {
      const user = User.new()
      user.otherSecret = { token: 'SHH!' }
      expect(user.otherSecret).toEqual({ token: 'SHH!' })
      expect(user.getAttribute('myOtherEncryptedSecret')).not.toEqual({ token: 'SHH!' })
      expect(typeof user.getAttribute('myOtherEncryptedSecret')).toEqual('string')
    })
  })

  context('with a column name string', () => {
    it('uses the provided column as the encryptedColumnName and registers the property as a string', () => {
      const deco = new Decorators<typeof UserWithColumnNameString>()
      class UserWithColumnNameString extends ApplicationModel {
        public override get table() {
          return 'users' as const
        }

        @deco.Encrypted('myOtherEncryptedSecret')
        public otherSecret: string
      }
      processDynamicallyDefinedModels(UserWithColumnNameString)

      expect(UserWithColumnNameString['encryptedAttributes']).toEqual([
        { property: 'otherSecret', encryptedColumnName: 'myOtherEncryptedSecret' },
      ])
      expect(UserWithColumnNameString['virtualAttributes']).toEqual([
        { property: 'otherSecret', type: ['string', 'null'] },
      ])

      const user = UserWithColumnNameString.new()
      user.otherSecret = 'shh!'
      expect(user.otherSecret).toEqual('shh!')
      expect(user.getAttribute('myOtherEncryptedSecret')).not.toEqual('shh!')
      expect(typeof user.getAttribute('myOtherEncryptedSecret')).toEqual('string')
    })
  })

  context('with an openapi shape and no column', () => {
    it('uses the word "encrypted" in front of the pascalized method name and registers the shape without adding null from the backing column', () => {
      const deco = new Decorators<typeof UserWithJsonSecret>()
      class UserWithJsonSecret extends ApplicationModel {
        public override get table() {
          return 'users' as const
        }

        @deco.Encrypted({ openapi: 'json' })
        public secret: unknown
      }
      processDynamicallyDefinedModels(UserWithJsonSecret)

      expect(UserWithJsonSecret['encryptedAttributes']).toEqual([
        { property: 'secret', encryptedColumnName: 'encryptedSecret' },
      ])
      expect(UserWithJsonSecret['virtualAttributes']).toEqual([{ property: 'secret', type: 'json' }])
    })
  })
})
