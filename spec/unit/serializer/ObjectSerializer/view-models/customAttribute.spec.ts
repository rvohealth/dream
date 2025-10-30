import CalendarDate from '../../../../../src/helpers/CalendarDate.js'
import ObjectSerializer from '../../../../../src/serializer/ObjectSerializer.js'
import { DreamSerializers } from '../../../../../src/types/dream.js'
import ApplicationModel from '../../../../../test-app/app/models/ApplicationModel.js'
import UserSerializer from '../../../../../test-app/app/serializers/view-model/UserSerializer.js'
import PetViewModel from '../../../../../test-app/app/view-models/PetViewModel.js'
import UserViewModel from '../../../../../test-app/app/view-models/UserViewModel.js'
import { SpeciesValues } from '../../../../../test-app/types/db.js'

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

describe('ObjectSerializer#customAttribute (on a view model)', () => {
  context('with passthrough data', () => {
    it('can access the passthrough data in the function', () => {
      const MySerializer = (user: User, passthroughData: { locale: string }) =>
        ObjectSerializer(user, passthroughData).customAttribute(
          'email',
          () => `${user.email}.${passthroughData?.locale}@peanuts.com`,
          { openapi: 'string' }
        )

      const serializer = MySerializer(new User({ email: 'abc', password: '123' }), { locale: 'en-US' })
      expect(serializer.render()).toEqual({
        email: 'abc.en-US@peanuts.com',
      })
    })
  })

  context('when serializing null', () => {
    it('renders the attributes as null', () => {
      const MySerializer = (user: User | null) =>
        ObjectSerializer(user).customAttribute('email', () => `${user!.email}@peanuts.com`, {
          openapi: 'string',
        })

      const serializer = MySerializer(null)
      expect(serializer.render()).toBeNull()
    })
  })

  context('flatten', () => {
    it('renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
      const pet = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: PetViewModel) =>
        ObjectSerializer(data)
          .attribute('species', { openapi: { type: ['string', 'null'], enum: SpeciesValues } })
          .customAttribute(
            'user',
            () => {
              const serializer = UserSerializer(data.user!)
              return serializer.render()
            },
            { openapi: { $serializer: UserSerializer }, flatten: true }
          )

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        species: 'dog',
        id: user.id,
        name: 'Charlie',
        favoriteWord: null,
        birthdate: birthdate.toISO(),
      })
    })
  })
})
