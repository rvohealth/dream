import { CalendarDate, DreamSerializers, ObjectSerializer } from '../../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../../src/serializer/SerializerRenderer.js'
import ApplicationModel from '../../../../../test-app/app/models/ApplicationModel.js'

class User {
  public name: string | undefined
  public birthdate: CalendarDate | undefined

  constructor({ name, birthdate }: { name?: string | undefined; birthdate?: CalendarDate }) {
    this.name = name
    this.birthdate = birthdate
  }

  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'UserSerializer',
      summary: 'UserSummarySerializer',
    }
  }
}

class Pet {
  public name: string | undefined
  public user: User | undefined

  constructor({ name, user }: { name?: string | undefined; user?: User }) {
    this.name = name
    this.user = user
  }

  public get serializers(): DreamSerializers<ApplicationModel> {
    return {
      default: 'PetSerializer',
      summary: 'PetSummarySerializer',
    }
  }
}

describe('ObjectSerializer (on a view model) delegated attributes', () => {
  it('delegates value and type to the specified target', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = new User({ name: 'Charlie', birthdate })
    const pet = new Pet({ user, name: 'Snoopy' })

    const MySerializer = (data: Pet) =>
      ObjectSerializer(data)
        .delegatedAttribute('user', 'name', { openapi: 'string' })
        .delegatedAttribute('user', 'birthdate', { openapi: 'date' })

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      name: 'Charlie',
      birthdate: birthdate.toISO(),
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']().attributes).toEqual({
      name: {
        type: 'string',
      },
      birthdate: {
        type: 'string',
        format: 'date',
      },
    })
  })
})
