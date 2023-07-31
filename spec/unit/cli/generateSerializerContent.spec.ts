import generateSerializerContent from '../../../src/helpers/cli/generateSerializerContent'

describe('psy generate:serializer <name> [...attributes]', () => {
  context('when not provided with a dream class', () => {
    it('renders a blank serializer with no types', async () => {
      const res = await generateSerializerContent('UserSerializer')

      expect(res).toEqual(
        `\
import { DreamSerializer } from 'dream'

export default class UserSerializer extends DreamSerializer {}`
      )
    })

    context('when passed attributes with no dream model', () => {
      it('generates a serializer adding requested attributes', async () => {
        const res = await generateSerializerContent('UserSerializer', undefined, ['logged_in_at'])

        expect(res).toEqual(
          `\
import { DreamSerializer, Attribute } from 'dream'

export default class UserSerializer extends DreamSerializer {
  @Attribute()
  public logged_in_at: any
}\
`
        )
      })
    })
  })

  context('when provided attributes', () => {
    context('when passed a dream class', () => {
      it('generates a serializer adding requested attributes, and also type-casts the serializer to the specified model', async () => {
        const res = await generateSerializerContent('UserSerializer', 'User', ['logged_in_at'])

        expect(res).toEqual(
          `\
import { DreamSerializer, Attribute } from 'dream'

export default class UserSerializer extends DreamSerializer<User> {
  @Attribute()
  public logged_in_at: any
}\
`
        )
      })
    })

    context('when passed type-decorated attributes', () => {
      context('one of those attributes is a string', () => {
        it('adds a string type to the field', async () => {
          const res = await generateSerializerContent('UserSerializer', 'User', ['howyadoin:string'])

          expect(res).toEqual(
            `\
import { DreamSerializer, Attribute } from 'dream'

export default class UserSerializer extends DreamSerializer<User> {
  @Attribute()
  public howyadoin: string
}\
`
          )
        })
      })

      context('one of those attributes is a number', () => {
        it('adds a string type to the field', async () => {
          const res = await generateSerializerContent('UserSerializer', 'User', ['howyadoin:number'])

          expect(res).toEqual(
            `\
import { DreamSerializer, Attribute } from 'dream'

export default class UserSerializer extends DreamSerializer<User> {
  @Attribute()
  public howyadoin: number
}\
`
          )
        })
      })

      context('one of those attributes is a decimal', () => {
        it('adds a string type to the field', async () => {
          const res = await generateSerializerContent('UserSerializer', 'User', ['howyadoin:decimal:4,2'])

          expect(res).toEqual(
            `\
import { DreamSerializer, Attribute } from 'dream'

export default class UserSerializer extends DreamSerializer<User> {
  @Attribute()
  public howyadoin: number
}\
`
          )
        })
      })

      context('one of those attributes is a datetime', () => {
        it('adds a DateTime type to the field', async () => {
          const res = await generateSerializerContent('UserSerializer', 'User', ['logged_in_at:datetime'])

          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { DreamSerializer, Attribute } from 'dream'

export default class UserSerializer extends DreamSerializer<User> {
  @Attribute()
  public logged_in_at: DateTime
}\
`
          )
        })
      })

      context('one of those attributes is a date', () => {
        it('adds a DateTime type to the field, and a date specifier to the Attribute statement', async () => {
          const res = await generateSerializerContent('UserSerializer', 'User', ['logged_in_on:date'])

          expect(res).toEqual(
            `\
import { DateTime } from 'luxon'
import { DreamSerializer, Attribute } from 'dream'

export default class UserSerializer extends DreamSerializer<User> {
  @Attribute('date')
  public logged_in_on: DateTime
}\
`
          )
        })
      })
    })
  })
})
