import { CalendarDate, ObjectSerializer } from '../../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../../src/serializer/SerializerOpenapiRenderer.js'
import UserSerializer from '../../../../../test-app/app/serializers/view-model/UserSerializer.js'
import PetViewModel from '../../../../../test-app/app/view-models/PetViewModel.js'
import UserViewModel from '../../../../../test-app/app/view-models/UserViewModel.js'
import { SpeciesValues } from '../../../../../test-app/types/db.js'

describe('ObjectSerializer (on a view model) rendersOne', () => {
  it('renders the ViewModel’s default serializer and includes the referenced serializer in the returned referencedSerializers array', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
    const pet = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const MySerializer = (data: PetViewModel) =>
      ObjectSerializer(data).rendersOne('user', { viewModelClass: UserViewModel })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      user: {
        id: user.id,
        name: 'Charlie',
        birthdate: birthdate.toISO(),
        favoriteWord: null,
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    const results = serializerOpenapiRenderer['renderedOpenapiAttributes']()
    expect(results.attributes).toEqual({
      user: {
        $ref: '#/components/schemas/view-modelUser',
      },
    })

    expect(results.referencedSerializers).toEqual([UserSerializer])
  })

  it('supports specifying a specific serializerKey', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
    const pet = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const MySerializer = (data: PetViewModel) =>
      ObjectSerializer(data).rendersOne('user', {
        viewModelClass: UserViewModel,
        serializerKey: 'summary',
      })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      user: {
        id: user.id,
        favoriteWord: 'hello',
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      user: {
        $ref: '#/components/schemas/UserSummary',
      },
    })
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
    const pet = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const MySerializer = (data: PetViewModel) =>
      ObjectSerializer(data).rendersOne('user', {
        viewModelClass: UserViewModel,
        as: 'user2',
      })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      user2: {
        id: user.id,
        name: 'Charlie',
        birthdate: birthdate.toISO(),
        favoriteWord: null,
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      user2: {
        $ref: '#/components/schemas/view-modelUser',
      },
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
          .rendersOne('user', { viewModelClass: UserViewModel, flatten: true })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
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
            $ref: '#/components/schemas/view-modelUser',
          },
        ],
      })
    })
  })

  it('supports supplying a custom serializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
    const pet = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const CustomSerializer = (data: UserViewModel) =>
      ObjectSerializer(data).attribute('name', { openapi: 'string' })
    ;(CustomSerializer as any)['globalName'] = 'CustomUserSerializer'
    ;(CustomSerializer as any)['openapiName'] = 'CustomUser'
    const MySerializer = (data: PetViewModel) =>
      ObjectSerializer(data).rendersOne('user', {
        serializer: CustomSerializer,
      })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      user: {
        name: 'Charlie',
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      user: {
        $ref: '#/components/schemas/CustomUser',
      },
    })
  })
})
