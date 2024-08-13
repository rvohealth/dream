import generateSerializerContent from '../../../src/helpers/cli/generateSerializerContent'

describe('dream generate:serializer <name> [...attributes]', () => {
  context('when provided attributes', () => {
    context('when passed a dream class', () => {
      it('generates a serializer adding requested attributes, casting the serializer type to the specified model', () => {
        const res = generateSerializerContent('User', ['logged_in_at'])

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
        it('correctly injects extra updirs to account for nested paths', () => {
          const res = generateSerializerContent('User/Admin')

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
        it('adds a string type to the field', () => {
          expectAttributeType('string', 'string')
        })
      })

      context('one of those attributes is json', () => {
        it('adds a number type to the field', () => {
          expectAttributeType('json', 'json')
        })
      })

      context('one of those attributes is jsonb', () => {
        it('adds a number type to the field', () => {
          expectAttributeType('jsonb', 'json')
        })
      })

      context('one of those attributes is a number', () => {
        it('adds a number type to the field', () => {
          expectAttributeType('number', 'number')
        })
      })

      context('one of those attributes is a decimal', () => {
        it('adds a number attribute, rounded to the precision of the decimal', () => {
          const res = generateSerializerContent('User', ['howyadoin:decimal:4,2'])

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
        it('adds a number attribute', () => {
          expectAttributeType('integer', 'number')
        })
      })

      context('one of those attributes is a bigint', () => {
        it('adds a string attribute', () => {
          expectAttributeType('bigint', 'string')
        })
      })

      context('one of those attributes is a uuid', () => {
        it('adds a string attribute', () => {
          expectAttributeType('uuid', 'string')
        })
      })

      context('one of those attributes is "varchar"', () => {
        it('adds a string attribute', () => {
          expectAttributeType('varchar', 'string')
        })
      })

      context('one of those attributes is "char"', () => {
        it('adds a string attribute', () => {
          expectAttributeType('char', 'string')
        })
      })

      context('one of those attributes is a datetime', () => {
        it('adds a datetime attribute', () => {
          expectAttributeType('datetime', 'datetime')
        })
      })

      context('one of those attributes is a date', () => {
        it('adds a date attribute', () => {
          expectAttributeType('date', 'date')
        })
      })

      context('one of those attributes is type "text"', () => {
        it('adds a string attribute', () => {
          expectAttributeType('text', 'string')
        })
      })

      context('one of those attributes is an enum', () => {
        it('adds an enum type to the Attribute call', () => {
          const res = generateSerializerContent('User', ['topping:enum:topping:cheese,baja_sauce'])

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
          it('correctly injects RendersOne decorator and imports for the model', () => {
            const res = generateSerializerContent('user', ['organization:belongs_to'])

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
  @RendersOne(() => Organization)
  public organization: Organization
}`
            )
          })
        })

        context('HasOne', () => {
          it('correctly injects RendersOne decorator and imports for the model', () => {
            const res = generateSerializerContent('User', ['Organization:has_one'])

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
  @RendersOne(() => Organization)
  public organization: Organization
}`
            )
          })
        })

        context('HasMany', () => {
          it('correctly injects RendersMany decorator and imports for the model', () => {
            const res = generateSerializerContent('User', ['Organization:has_many'])

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
  @RendersMany(() => Organization)
  public organizations: Organization[]
}`
            )
          })

          context('when passed an association that should not be pluralized', () => {
            it('correctly injects RendersMany decorator and imports for the model', () => {
              const res = generateSerializerContent('User', ['Paper:has_many'])

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
  @RendersMany(() => Paper)
  public paper: Paper[]
}`
              )
            })
          })
        })

        context('nested models', () => {
          it('correctly injects decorator and imports for the model, accounting for nesting', () => {
            const res = generateSerializerContent('User/Admin', ['Double/Nested/MyModel:belongs_to'])

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
  @RendersOne(() => MyModel)
  public myModel: MyModel
}`
            )
          })
        })
      })
    })
  })
})

function expectAttributeType(startingAttributeType: string, generatedAttributeType: string) {
  const res = generateSerializerContent('User', [`howyadoin:${startingAttributeType}`])
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
