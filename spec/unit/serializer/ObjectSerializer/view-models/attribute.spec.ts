import { CalendarDate, DreamSerializers } from '../../../../../src/index.js'
import ObjectSerializer from '../../../../../src/serializer/ObjectSerializer.js'
import ApplicationModel from '../../../../../test-app/app/models/ApplicationModel.js'
import UserSerializer from '../../../../../test-app/app/serializers/view-model/UserSerializer.js'
import UserViewModel from '../../../../../test-app/app/view-models/UserViewModel.js'

class User {
  public email: string
  public password: string
  public name: string | undefined
  public birthdate: CalendarDate | undefined

  constructor({
    email,
    password,
    name,
    birthdate,
  }: {
    email: string
    password: string
    name?: string | undefined
    birthdate?: CalendarDate
  }) {
    this.email = email
    this.password = password
    this.name = name
    this.birthdate = birthdate
  }

  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'view-model/UserSerializer',
      summary: 'view-model/UserSummarySerializer',
    }
  }
}

class ModelForOpenapiTypeSpecs {
  public volume: number | undefined
  public requiredNicknames: string[]

  constructor({ volume, requiredNicknames }: { volume?: number | undefined; requiredNicknames?: string[] }) {
    this.volume = volume
    this.requiredNicknames = requiredNicknames ?? []
  }

  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'view-model/PetSerializer',
      summary: 'view-model/PetSummarySerializer',
    }
  }
}

describe('ObjectSerializer (on a view model) attributes', () => {
  it('can render Dream attributes', () => {
    const serializer = UserSerializer(
      new UserViewModel({
        id: '7',
        name: 'Charlie',
        birthdate: CalendarDate.fromISO('1950-10-02'),
        favoriteWord: 'football',
      })
    )

    expect(serializer.render()).toEqual({
      id: '7',
      name: 'Charlie',
      birthdate: '1950-10-02',
      favoriteWord: 'football',
    })
  })

  it('supports customizing the name of the thing rendered', () => {
    const MySerializer = (data: User) =>
      ObjectSerializer(data).attribute('email', { as: 'email2', openapi: 'string' })

    const serializer = MySerializer(new User({ email: 'abc', password: '123' }))

    expect(serializer.render()).toEqual({
      email2: 'abc',
    })
  })

  context('when serializing null', () => {
    it('renderedAttributes is null', () => {
      const MySerializer = (data: User | null) =>
        ObjectSerializer(data).attribute('email', { openapi: 'string' })

      const serializer = MySerializer(null)
      expect(serializer.render()).toBeNull()
    })
  })

  it('can render attributes from serializers that "extend" other serializers', () => {
    const BaseSerializer = (data: User) =>
      ObjectSerializer(data).attribute('name', { openapi: ['string', 'null'] })
    const MySerializer = (data: User) => BaseSerializer(data).attribute('email', { openapi: 'string' })

    const serializer = MySerializer(new User({ name: 'Snoopy', email: 'abc', password: '123' }))

    expect(serializer.render()).toEqual({
      name: 'Snoopy',
      email: 'abc',
    })
  })

  context('numeric/decimal with precision', () => {
    it('rounds to specified precision', () => {
      const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
        ObjectSerializer(data).attribute('volume', {
          openapi: ['decimal', 'null'],
          precision: 1,
        })

      const serializer = MySerializer(new ModelForOpenapiTypeSpecs({ volume: 7.777 }))
      expect(serializer.render()).toEqual({
        volume: 7.8,
      })
    })
  })

  context('with casing specified', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      ObjectSerializer(data).attribute('requiredNicknames', {
        openapi: 'string[]',
      })

    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        const serializer = MySerializer(new ModelForOpenapiTypeSpecs({ requiredNicknames: ['Chuck'] }))
        expect(serializer.render({}, { casing: 'snake' })).toEqual({
          required_nicknames: ['Chuck'],
        })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        const serializer = MySerializer(new ModelForOpenapiTypeSpecs({ requiredNicknames: ['Chuck'] }))
        expect(serializer.render({}, { casing: 'camel' })).toEqual({
          requiredNicknames: ['Chuck'],
        })
      })
    })
  })
})
