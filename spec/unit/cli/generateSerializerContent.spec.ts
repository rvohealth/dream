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
import { DreamSerializer, Attribute, DreamColumn } from '@rvohealth/dream'
import User from '../models/User'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object
> extends UserSummarySerializer<DataType, Passthrough> {
  @Attribute()
  public loggedInAt: DreamColumn<User, 'loggedInAt'>
}`
        )
      })
    })

    context('nested paths', () => {
      context('when passed a nested model class', () => {
        it('correctly injects extra updirs to account for nested paths', async () => {
          const res = await generateSerializerContent('User/AdminSerializer', 'User/Admin')

          expect(res).toEqual(
            `\
import { DreamSerializer, Attribute, DreamColumn } from '@rvohealth/dream'
import Admin from '../../models/User/Admin'

export class UserAdminSummarySerializer<
  DataType extends Admin,
  Passthrough extends object
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<Admin, 'id'>
}

export default class UserAdminSerializer<
  DataType extends Admin,
  Passthrough extends object
> extends UserAdminSummarySerializer<DataType, Passthrough> {
  
}`
          )
        })
      })
    })

    context('when passed type-decorated attributes', () => {
      context('one of those attributes is a string', () => {
        it('adds a string type to the field', async () => {
          await expectAttributeType('string', 'string')
        })
      })

      context('one of those attributes is json', () => {
        it('adds a number type to the field', async () => {
          await expectAttributeType('json', 'json')
        })
      })

      context('one of those attributes is jsonb', () => {
        it('adds a number type to the field', async () => {
          await expectAttributeType('jsonb', 'json')
        })
      })

      context('one of those attributes is a number', () => {
        it('adds a number type to the field', async () => {
          await expectAttributeType('number', 'number')
        })
      })

      context('one of those attributes is a decimal', () => {
        it('adds a number attribute, rounded to the precision of the decimal', async () => {
          const res = await generateSerializerContent('UserSerializer', 'User', ['howyadoin:decimal:4,2'])

          expect(res).toEqual(
            `\
import { DreamSerializer, Attribute, DreamColumn } from '@rvohealth/dream'
import User from '../models/User'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object
> extends UserSummarySerializer<DataType, Passthrough> {
  @Attribute('decimal', { precision: 2 })
  public howyadoin: DreamColumn<User, 'howyadoin'>
}\
`
          )
        })
      })

      context('one of those attributes is an integer', () => {
        it('adds a number attribute', async () => {
          await expectAttributeType('integer', 'number')
        })
      })

      context('one of those attributes is a bigint', () => {
        it('adds a string attribute', async () => {
          await expectAttributeType('bigint', 'string')
        })
      })

      context('one of those attributes is a uuid', () => {
        it('adds a string attribute', async () => {
          await expectAttributeType('uuid', 'string')
        })
      })

      context('one of those attributes is "varchar"', () => {
        it('adds a string attribute', async () => {
          await expectAttributeType('varchar', 'string')
        })
      })

      context('one of those attributes is "char"', () => {
        it('adds a string attribute', async () => {
          await expectAttributeType('char', 'string')
        })
      })

      context('one of those attributes is a datetime', () => {
        it('adds a datetime attribute', async () => {
          await expectAttributeType('datetime', 'datetime')
        })
      })

      context('one of those attributes is a date', () => {
        it('adds a date attribute', async () => {
          await expectAttributeType('date', 'date')
        })
      })

      context('one of those attributes is type "text"', () => {
        it('adds a string attribute', async () => {
          await expectAttributeType('text', 'string')
        })
      })

      context('one of those attributes is an enum', () => {
        it('adds an enum type to the Attribute call', async () => {
          const res = await generateSerializerContent('UserSerializer', 'User', [
            'topping:enum:topping:cheese,baja_sauce',
          ])

          expect(res).toEqual(
            `\
import { DreamSerializer, Attribute, DreamColumn } from '@rvohealth/dream'
import { ToppingEnumValues } from '../../db/sync'
import User from '../models/User'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object
> extends UserSummarySerializer<DataType, Passthrough> {
  @Attribute({ type: 'string', enum: ToppingEnumValues })
  public topping: DreamColumn<User, 'topping'>
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
import { DreamSerializer, Attribute, DreamColumn, RendersOne } from '@rvohealth/dream'
import User from '../models/User'
import Organization from '../models/Organization'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object
> extends UserSummarySerializer<DataType, Passthrough> {
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
import { DreamSerializer, Attribute, DreamColumn, RendersOne } from '@rvohealth/dream'
import User from '../models/User'
import Organization from '../models/Organization'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object
> extends UserSummarySerializer<DataType, Passthrough> {
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
import { DreamSerializer, Attribute, DreamColumn, RendersMany } from '@rvohealth/dream'
import User from '../models/User'
import Organization from '../models/Organization'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object
> extends UserSummarySerializer<DataType, Passthrough> {
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
import { DreamSerializer, Attribute, DreamColumn, RendersMany } from '@rvohealth/dream'
import User from '../models/User'
import Paper from '../models/Paper'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object
> extends UserSummarySerializer<DataType, Passthrough> {
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
import { DreamSerializer, Attribute, DreamColumn, RendersOne } from '@rvohealth/dream'
import Admin from '../../models/User/Admin'
import MyModel from '../../models/Double/Nested/MyModel'

export class UserAdminSummarySerializer<
  DataType extends Admin,
  Passthrough extends object
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<Admin, 'id'>
}

export default class UserAdminSerializer<
  DataType extends Admin,
  Passthrough extends object
> extends UserAdminSummarySerializer<DataType, Passthrough> {
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

async function expectAttributeType(startingAttributeType: string, generatedAttributeType: string) {
  const res = await generateSerializerContent('UserSerializer', 'User', [
    `howyadoin:${startingAttributeType}`,
  ])
  expect(res).toEqual(
    `\
import { DreamSerializer, Attribute, DreamColumn } from '@rvohealth/dream'
import User from '../models/User'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object
> extends UserSummarySerializer<DataType, Passthrough> {
  @Attribute('${generatedAttributeType}')
  public howyadoin: DreamColumn<User, 'howyadoin'>
}\
`
  )
}
