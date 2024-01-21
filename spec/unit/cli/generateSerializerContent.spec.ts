import generateSerializerContent from '../../../src/helpers/cli/generateSerializerContent'

describe('dream generate:serializer <name> [...attributes]', () => {
  context('when not provided with a dream class', () => {
    it('renders a blank serializer with no types', async () => {
      const res = await generateSerializerContent('UserSerializer')

      expect(res).toEqual(
        `\
import { DreamSerializer, Attribute } from '@rvohealth/dream'

export default class UserSerializer extends DreamSerializer {
  
}`
      )
    })

    context('when passed attributes with no dream model', () => {
      it('generates a serializer adding requested attributes', async () => {
        const res = await generateSerializerContent('UserSerializer', undefined, ['logged_in_at'])

        expect(res).toEqual(
          `\
import { DreamSerializer, Attribute } from '@rvohealth/dream'

export default class UserSerializer extends DreamSerializer {
  @Attribute()
  public loggedInAt: any
}\
`
        )
      })
    })
  })

  context('when provided attributes', () => {
    context('when passed a dream class', () => {
      it('generates a serializer adding requested attributes, casting the serializer type to the specified model', async () => {
        const res = await generateSerializerContent('UserSerializer', 'User', ['logged_in_at'])

        expect(res).toEqual(
          `\
import { DreamSerializer, Attribute } from '@rvohealth/dream'
import User from '../models/User'

export default class UserSerializer<DataType extends User> extends DreamSerializer<DataType> {
  @Attribute()
  public loggedInAt: any
}\
`
        )
      })
    })

    context('nested paths', () => {
      context('when passed a nested model class', () => {
        it('correctly injects extra updirs to account for nested paths', async () => {
          const res = await generateSerializerContent('User/AdminSerializer', 'User/Admin')

          expect(res).toEqual(
            `\
import { DreamSerializer, Attribute } from '@rvohealth/dream'
import Admin from '../../models/User/Admin'

export default class UserAdminSerializer<DataType extends Admin> extends DreamSerializer<DataType> {
  
}`
          )
        })
      })
    })

    context('when passed type-decorated attributes', () => {
      context('one of those attributes is a string', () => {
        it('adds a string type to the field', async () => {
          const res = await generateSerializerContent('UserSerializer', 'User', ['howyadoin:string'])

          expect(res).toEqual(
            `\
import { DreamSerializer, Attribute } from '@rvohealth/dream'
import User from '../models/User'

export default class UserSerializer<DataType extends User> extends DreamSerializer<DataType> {
  @Attribute('string')
  public howyadoin: string
}\
`
          )
        })
      })

      context('one of those attributes is a number', () => {
        it('adds a number type to the field', async () => {
          const res = await generateSerializerContent('UserSerializer', 'User', ['howyadoin:number'])

          expect(res).toEqual(
            `\
import { DreamSerializer, Attribute } from '@rvohealth/dream'
import User from '../models/User'

export default class UserSerializer<DataType extends User> extends DreamSerializer<DataType> {
  @Attribute('number')
  public howyadoin: number
}\
`
          )
        })
      })

      context('one of those attributes is a decimal', () => {
        it('adds a number attribute, rounded to the precision of the decimal', async () => {
          const res = await generateSerializerContent('UserSerializer', 'User', ['howyadoin:decimal:4,2'])

          expect(res).toEqual(
            `\
import { DreamSerializer, Attribute } from '@rvohealth/dream'
import User from '../models/User'

export default class UserSerializer<DataType extends User> extends DreamSerializer<DataType> {
  @Attribute('round', { precision: 2 })
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
import { DreamSerializer, Attribute } from '@rvohealth/dream'
import User from '../models/User'

export default class UserSerializer<DataType extends User> extends DreamSerializer<DataType> {
  @Attribute('datetime')
  public loggedInAt: DateTime
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
import { DreamSerializer, Attribute } from '@rvohealth/dream'
import User from '../models/User'

export default class UserSerializer<DataType extends User> extends DreamSerializer<DataType> {
  @Attribute('date')
  public loggedInOn: DateTime
}\
`
          )
        })
      })

      context('one of those attributes is an enum', () => {
        it('adds an enum type to the Attribute call', async () => {
          const res = await generateSerializerContent('UserSerializer', 'User', [
            'topping:enum:topping:cheese,baja_sauce',
          ])

          expect(res).toEqual(
            `\
import { DreamSerializer, Attribute } from '@rvohealth/dream'
import { ToppingEnum } from '../../../test-app/db/schema'
import User from '../models/User'

export default class UserSerializer<DataType extends User> extends DreamSerializer<DataType> {
  @Attribute('enum:ToppingEnum')
  public topping: ToppingEnum
}\
`
          )
        })
      })

      context('when one of those attributes is an association', () => {
        context('BelongsTo', () => {
          it('correctly injects RendersOne decorator and imports for the model', async () => {
            const res = await generateSerializerContent('UserSerializer', 'user', ['organization:belongs_to'])

            expect(res).toEqual(
              `\
import { DreamSerializer, Attribute, RendersOne } from '@rvohealth/dream'
import User from '../models/User'
import Organization from '../models/Organization'

export default class UserSerializer<DataType extends User> extends DreamSerializer<DataType> {
  @RendersOne()
  public organization: Organization
}`
            )
          })
        })

        context('HasOne', () => {
          it('correctly injects RendersOne decorator and imports for the model', async () => {
            const res = await generateSerializerContent('UserSerializer', 'User', ['Organization:has_one'])

            expect(res).toEqual(
              `\
import { DreamSerializer, Attribute, RendersOne } from '@rvohealth/dream'
import User from '../models/User'
import Organization from '../models/Organization'

export default class UserSerializer<DataType extends User> extends DreamSerializer<DataType> {
  @RendersOne()
  public organization: Organization
}`
            )
          })
        })

        context('HasMany', () => {
          it('correctly injects RendersMany decorator and imports for the model', async () => {
            const res = await generateSerializerContent('UserSerializer', 'User', ['Organization:has_many'])

            expect(res).toEqual(
              `\
import { DreamSerializer, Attribute, RendersMany } from '@rvohealth/dream'
import User from '../models/User'
import Organization from '../models/Organization'

export default class UserSerializer<DataType extends User> extends DreamSerializer<DataType> {
  @RendersMany()
  public organizations: Organization[]
}`
            )
          })

          context('when passed an association that should not be pluralized', () => {
            it('correctly injects RendersMany decorator and imports for the model', async () => {
              const res = await generateSerializerContent('UserSerializer', 'User', ['Paper:has_many'])

              expect(res).toEqual(
                `\
import { DreamSerializer, Attribute, RendersMany } from '@rvohealth/dream'
import User from '../models/User'
import Paper from '../models/Paper'

export default class UserSerializer<DataType extends User> extends DreamSerializer<DataType> {
  @RendersMany()
  public paper: Paper[]
}`
              )
            })
          })
        })

        context('nested models', () => {
          it('correctly injects decorator and imports for the model, accounting for nesting', async () => {
            const res = await generateSerializerContent('User/AdminSerializer', 'User/Admin', [
              'Double/Nested/MyModel:belongs_to',
            ])

            expect(res).toEqual(
              `\
import { DreamSerializer, Attribute, RendersOne } from '@rvohealth/dream'
import Admin from '../../models/User/Admin'
import MyModel from '../../models/Double/Nested/MyModel'

export default class UserAdminSerializer<DataType extends Admin> extends DreamSerializer<DataType> {
  @RendersOne()
  public myModel: MyModel
}`
            )
          })
        })
      })
    })
  })
})
