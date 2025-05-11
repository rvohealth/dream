import { CalendarDate, DreamSerializer, ObjectSerializer } from '../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import { default as DreamUser } from '../../../../test-app/app/models/User.js'
import { Species, SpeciesValues } from '../../../../test-app/types/db.js'

interface SimpleUser {
  id: string
  name?: string
  birthdate?: CalendarDate
}

interface PetWithDreamUser {
  id: string
  name?: string
  user?: DreamUser
  species?: Species
}

interface PetWithSimpleUser {
  id: string
  name?: string
  user?: SimpleUser
  species?: Species
}

describe('ObjectSerializer rendersOne', () => {
  context('simple objects', () => {
    it('renders the associated objects using the provided serializer callback', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user: SimpleUser = { id: '7', name: 'Charlie', birthdate }
      const pet: PetWithSimpleUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const UserSerializer = (data: SimpleUser) =>
        ObjectSerializer(data).attribute('name', { openapi: ['string', 'null'] })
      ;(UserSerializer as any)['globalName'] = 'CustomUserSerializer'
      const MySerializer = (data: PetWithSimpleUser) =>
        ObjectSerializer(data).rendersOne('user', { serializerCallback: () => UserSerializer })

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
          $ref: '#/components/schemas/CustomUser',
        },
      })
    })
  })

  context('Dream model', () => {
    it('renders the Dream model’s default serializer', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate })
      const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { dreamClass: DreamUser })

      const serializer = MySerializer(pet)

      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        user: {
          id: user.id,
          name: 'Charlie',
          birthdate: birthdate.toISO(),
        },
      })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        user: {
          $ref: '#/components/schemas/User',
        },
      })
    })

    it('supports specifying a specific serializerKey', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
      const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { dreamClass: DreamUser, serializerKey: 'summary' })

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
          $ref: '#/components/schemas/UserSummary',
        },
      })
    })

    it('supports supplying a custom serializer', () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
      const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const CustomSerializer = (data: DreamUser) => DreamSerializer(DreamUser, data).attribute('name')
      ;(CustomSerializer as any)['globalName'] = 'CustomUserSerializer'
      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { serializerCallback: () => CustomSerializer })

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
          $ref: '#/components/schemas/CustomUser',
        },
      })
    })

    it("supports customizing the name of the thing rendered via { as: '...' } (replaces `source: string`)", () => {
      const birthdate = CalendarDate.fromISO('1950-10-02')
      const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
      const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

      const MySerializer = (data: PetWithDreamUser) =>
        ObjectSerializer(data).rendersOne('user', { dreamClass: DreamUser, as: 'user2' })

      const serializer = MySerializer(pet)

      const serializerRenderer = new SerializerRenderer(serializer)
      expect(serializerRenderer.render()).toEqual({
        user2: {
          id: user.id,
          name: 'Charlie',
          birthdate: birthdate.toISO(),
        },
      })

      const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
      expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
        user2: {
          $ref: '#/components/schemas/User',
        },
      })
    })

    context('flatten', () => {
      it('renders the serialized data into this model and adjusts the OpenAPI spec accordingly', () => {
        const birthdate = CalendarDate.fromISO('1950-10-02')
        const user = DreamUser.new({ id: '7', name: 'Charlie', birthdate, favoriteWord: 'hello' })
        const pet: PetWithDreamUser = { id: '3', user, name: 'Snoopy', species: 'dog' }

        const MySerializer = (data: PetWithDreamUser) =>
          ObjectSerializer(data)
            .attribute('species', { openapi: { type: ['string', 'null'], enum: SpeciesValues } })
            .rendersOne('user', { dreamClass: DreamUser, flatten: true })

        const serializer = MySerializer(pet)

        const serializerRenderer = new SerializerRenderer(serializer)
        expect(serializerRenderer.render()).toEqual({
          species: 'dog',
          id: user.id,
          name: 'Charlie',
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
              $ref: '#/components/schemas/User',
            },
          ],
        })
      })
    })
  })
})
