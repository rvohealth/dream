import { CalendarDate, ViewModelSerializer } from '../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import PetViewModel from '../../../../test-app/app/view-models/PetViewModel.js'
import UserViewModel from '../../../../test-app/app/view-models/UserViewModel.js'
import { SpeciesValues } from '../../../../test-app/types/db.js'

describe('ViewModelSerializer rendersOne', () => {
  it('renders the ViewModel’s default serializer', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
    const pet = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const MySerializer = (data: PetViewModel) =>
      ViewModelSerializer(PetViewModel, data).rendersOne('user', { viewModelClass: UserViewModel })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user: {
        id: user.id,
        name: 'Charlie',
        birthdate: expect.toEqualCalendarDate(birthdate),
        favoriteWord: null,
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      user: {
        $ref: '#/components/schemas/view-model_UserSerializer',
      },
    })
  })

  it('supports specifying a specific serializerKey', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
    const pet = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const MySerializer = (data: PetViewModel) =>
      ViewModelSerializer(PetViewModel, data).rendersOne('user', {
        viewModelClass: UserViewModel,
        serializerKey: 'summary',
      })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user: {
        id: user.id,
        favoriteWord: 'hello',
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      user: {
        $ref: '#/components/schemas/view-model_UserSummarySerializer',
      },
    })
  })

  it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
    const pet = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })

    const MySerializer = (data: PetViewModel) =>
      ViewModelSerializer(PetViewModel, data).rendersOne('user', {
        viewModelClass: UserViewModel,
        as: 'user2',
      })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user2: {
        id: user.id,
        name: 'Charlie',
        birthdate: expect.toEqualCalendarDate(birthdate),
        favoriteWord: null,
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      user2: {
        $ref: '#/components/schemas/view-model_UserSerializer',
      },
    })
  })

  context('flatten', () => {
    it('it renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = new UserViewModel({ id: '7', name: 'Charlie', birthdate })
      const pet = new PetViewModel({ id: '3', user, name: 'Snoopy', species: 'dog' })

      const MySerializer = (data: PetViewModel) =>
        ViewModelSerializer(PetViewModel, data)
          .attribute('species', { openapi: { type: ['string', 'null'], enum: SpeciesValues } })
          .rendersOne('user', { viewModelClass: UserViewModel, flatten: true })

      const serializer = MySerializer(pet)

      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        species: 'dog',
        id: user.id,
        name: 'Charlie',
        favoriteWord: null,
        birthdate: expect.toEqualCalendarDate(birthdate),
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
            $ref: '#/components/schemas/view-model_UserSerializer',
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
      ViewModelSerializer(UserViewModel, data).attribute('name', { openapi: 'string' })
    ;(CustomSerializer as any)['globalName'] = 'CustomUserSerializer'
    const MySerializer = (data: PetViewModel) =>
      ViewModelSerializer(PetViewModel, data).rendersOne('user', {
        serializerCallback: () => CustomSerializer,
      })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      user: {
        name: 'Charlie',
      },
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      user: {
        $ref: '#/components/schemas/CustomUserSerializer',
      },
    })
  })
})
