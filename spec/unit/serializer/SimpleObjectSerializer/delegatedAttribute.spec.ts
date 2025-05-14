import { CalendarDate, SimpleObjectSerializer } from '../../../../src/index.js'
import SerializerOpenapiRenderer from '../../../../src/serializer/SerializerOpenapiRenderer.js'
import SerializerRenderer from '../../../../src/serializer/SerializerRenderer.js'
import Pet from '../../../../test-app/app/models/Pet.js'

describe('SimpleObjectSerializer delegated attributes', () => {
  it('delegates value and type to the specified target', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = { name: 'Charlie', birthdate }
    const pet = { user, name: 'Snoopy' }

    const MySerializer = ($data: Pet) =>
      SimpleObjectSerializer(Pet, $data)
        .delegatedAttribute('user', 'name', 'string')
        .delegatedAttribute('user', 'birthdate', 'date')

    const serializer = MySerializer(pet)

    const serializerRenderer = new SerializerRenderer(serializer)
    expect(serializerRenderer.render()).toEqual({
      name: 'Charlie',
      birthdate: expect.toEqualCalendarDate(birthdate),
    })

    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(MySerializer)
    expect(serializerOpenapiRenderer['renderedOpenapiAttributes']).toEqual({
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
