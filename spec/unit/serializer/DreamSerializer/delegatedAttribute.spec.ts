import { CalendarDate, DreamSerializer } from '../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer delegated attributes', () => {
  it('delegates value and type to the specified target', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ name: 'Charlie', birthdate })
    const pet = Pet.new({ user, name: 'Snoopy' })

    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data)
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
