import { CalendarDate, DreamSerializers, round } from '../../../../../src/index.js'
import ObjectSerializer from '../../../../../src/serializer/ObjectSerializer.js'
import SerializerOpenapiRenderer from '../../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../../src/serializer/SerializerRenderer.js'
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

class ModelForOpenapiTypeSpecs {
  public volume: number | undefined
  public requiredNicknames: string[]
  public birthdate: CalendarDate | undefined

  constructor({
    volume,
    birthdate,
    requiredNicknames,
  }: {
    volume?: number | undefined
    birthdate?: CalendarDate
    requiredNicknames?: string[]
  }) {
    this.volume = volume
    this.birthdate = birthdate
    this.requiredNicknames = requiredNicknames ?? []
  }

  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'PetSerializer',
      summary: 'PetSummarySerializer',
    }
  }
}

describe('ObjectSerializer (on a view model) customAttributes', () => {
  it('can render the results of calling the callback function', () => {
    const MySerializer = (user: User) =>
      ObjectSerializer(user).customAttribute('email', () => `${user.email}@peanuts.com`, {
        openapi: 'string',
      })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      email: {
        type: 'string',
      },
    })
  })

  it('can override the OpenAPI shape with OpenAPI shorthand', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      ObjectSerializer(data).customAttribute('birthdate', () => data.birthdate?.toDateTime()?.toISO(), {
        openapi: 'date-time',
      })
    const model = new ModelForOpenapiTypeSpecs({
      birthdate: CalendarDate.fromISO('1950-10-02'),
    })

    const serializer = MySerializer(model)
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      birthdate: model.birthdate!.toDateTime()!.toISO(),
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      birthdate: {
        type: 'string',
        format: 'date-time',
      },
    })
  })

  it('can override the OpenAPI shape with an OpenAPI object', () => {
    const MySerializer = (data: ModelForOpenapiTypeSpecs) =>
      ObjectSerializer(data).customAttribute('volume', () => round(data.volume ?? 0), {
        openapi: {
          type: 'integer',
          format: undefined,
          description: 'Volume as an integer',
        },
      })

    const model = new ModelForOpenapiTypeSpecs({
      volume: 7.778,
    })

    const serializer = MySerializer(model)
    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      volume: 8,
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      volume: {
        type: 'integer',
        description: 'Volume as an integer',
      },
    })
  })

  context('with passthrough data', () => {
    it('can access the passthrough data in the function', () => {
      const MySerializer = (user: User, passthroughData: { locale: string }) =>
        ObjectSerializer(user, passthroughData).customAttribute(
          'email',
          () => `${user.email}.${passthroughData?.locale}@peanuts.com`,
          { openapi: 'string' }
        )

      const serializer = MySerializer(new User({ email: 'abc', password: '123' }), { locale: 'en-US' })
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        email: 'abc.en-US@peanuts.com',
      })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        email: {
          type: 'string',
        },
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
      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toBeNull()

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        email: {
          type: 'string',
        },
      })
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
              return new SerializerRenderer(serializer).render()
            },
            { openapi: { $serializer: UserSerializer }, flatten: true }
          )

      const serializer = MySerializer(pet)

      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        species: 'dog',
        id: user.id,
        name: 'Charlie',
        favoriteWord: null,
        birthdate: birthdate.toISO(),
      })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer.renderedOpenapi().openapi).toEqual({
        allOf: [
          {
            type: 'object',
            required: ['species'],
            properties: {
              species: { type: ['string', 'null'], enum: SpeciesValues },
            },
          },
          {
            $ref: '#/components/schemas/view-model_User',
          },
        ],
      })
    })
  })
})
