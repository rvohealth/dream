import generateSerializerContent from '../../../src/helpers/cli/generateSerializerContent.js'

describe('dream generate:serializer <name> [...attributes]', () => {
  context('when provided attributes', () => {
    context('when passed a dream class', () => {
      it('generates a serializer adding requested attributes, casting the serializer type to the specified model', () => {
        const res = generateSerializerContent({
          fullyQualifiedModelName: 'User',
          columnsWithTypes: ['logged_in_at'],
        })

        expect(res).toEqual(
          `\
import { Attribute, DreamColumn, DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute(User)
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object,
> extends UserSummarySerializer<DataType, Passthrough> {
  @Attribute(User)
  public loggedInAt: DreamColumn<User, 'loggedInAt'>
}
`
        )
      })
    })

    context('when parentName is included', () => {
      it('the serializers extend the parent serializers, summary omits id', () => {
        const res = generateSerializerContent({
          fullyQualifiedModelName: 'Foo/Bar/Baz',
          columnsWithTypes: ['hello'],
          fullyQualifiedParentName: 'Foo/Bar',
        })

        expect(res).toEqual(
          `\
import { Attribute, DreamColumn } from '@rvoh/dream'
import BarSerializer, { BarSummarySerializer } from '../BarSerializer.js'
import FooBarBaz from '../../../models/Foo/Bar/Baz.js'

export class BazSummarySerializer<
  DataType extends FooBarBaz,
  Passthrough extends object,
> extends BarSummarySerializer<DataType, Passthrough> {
}

export default class BazSerializer<
  DataType extends FooBarBaz,
  Passthrough extends object,
> extends BarSerializer<DataType, Passthrough> {
  @Attribute(FooBarBaz)
  public hello: DreamColumn<FooBarBaz, 'hello'>
}
`
        )
      })
    })

    context('nested paths', () => {
      context('when passed a nested model class', () => {
        it(
          'correctly injects extra updirs to account for nested paths, but leaves ' +
            'the class name as just the model name + Serializer/SummarySerializer so that ' +
            'the serializers getter in the model does not replicate the nesting structure twice',
          () => {
            const res = generateSerializerContent({ fullyQualifiedModelName: 'User/Admin' })

            expect(res).toEqual(
              `\
import { Attribute, DreamColumn, DreamSerializer } from '@rvoh/dream'
import UserAdmin from '../../models/User/Admin.js'

export class AdminSummarySerializer<
  DataType extends UserAdmin,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute(UserAdmin)
  public id: DreamColumn<UserAdmin, 'id'>
}

export default class AdminSerializer<
  DataType extends UserAdmin,
  Passthrough extends object,
> extends AdminSummarySerializer<DataType, Passthrough> {

}
`
            )
          }
        )
      })
    })

    context('when passed type-decorated attributes', () => {
      context('one of those attributes is a string', () => {
        it('adds a string type to the field', () => {
          expectAttributeType('string')
        })
      })

      context('one of those attributes is json', () => {
        it('adds a number type to the field', () => {
          expectAttributeType('json')
        })
      })

      context('one of those attributes is jsonb', () => {
        it('adds a number type to the field', () => {
          expectAttributeType('jsonb')
        })
      })

      context('one of those attributes is a number', () => {
        it('adds a number type to the field', () => {
          expectAttributeType('number')
        })
      })

      context('one of those attributes is a decimal', () => {
        it('adds a number attribute, rounded to the precision of the decimal', () => {
          const res = generateSerializerContent({
            fullyQualifiedModelName: 'User',
            columnsWithTypes: ['howyadoin:decimal:4,2'],
          })

          expect(res).toEqual(
            `\
import { Attribute, DreamColumn, DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute(User)
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object,
> extends UserSummarySerializer<DataType, Passthrough> {
  @Attribute(User, { precision: 2 })
  public howyadoin: DreamColumn<User, 'howyadoin'>
}
`
          )
        })
      })

      context('one of those attributes is an integer', () => {
        it('adds a number attribute', () => {
          expectAttributeType('integer')
        })
      })

      context('one of those attributes is a bigint', () => {
        it('adds a string attribute', () => {
          expectAttributeType('bigint')
        })
      })

      context('one of those attributes is a uuid', () => {
        it('adds a string attribute', () => {
          expectAttributeType('uuid')
        })
      })

      context('one of those attributes is "varchar"', () => {
        it('adds a string attribute', () => {
          expectAttributeType('varchar')
        })
      })

      context('one of those attributes is "char"', () => {
        it('adds a string attribute', () => {
          expectAttributeType('char')
        })
      })

      context('one of those attributes is a datetime', () => {
        it('adds a datetime attribute', () => {
          expectAttributeType('datetime')
        })
      })

      context('one of those attributes is a date', () => {
        it('adds a date attribute', () => {
          expectAttributeType('date')
        })
      })

      context('one of those attributes is type "text"', () => {
        it('adds a string attribute', () => {
          expectAttributeType('text')
        })
      })

      context('one of those attributes is an enum', () => {
        it('adds an enum type to the Attribute call', () => {
          const res = generateSerializerContent({
            fullyQualifiedModelName: 'User',
            columnsWithTypes: ['topping:enum:topping:cheese,baja_sauce'],
          })

          expect(res).toEqual(
            `\
import { Attribute, DreamColumn, DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute(User)
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object,
> extends UserSummarySerializer<DataType, Passthrough> {
  @Attribute(User)
  public topping: DreamColumn<User, 'topping'>
}
`
          )
        })
      })

      context('when one of those attributes is an association', () => {
        context('belongs_to', () => {
          it('omits it from the attributes', () => {
            const res = generateSerializerContent({
              fullyQualifiedModelName: 'user',
              columnsWithTypes: ['organization:belongs_to'],
            })

            expect(res).toEqual(
              `\
import { Attribute, DreamColumn, DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute(User)
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object,
> extends UserSummarySerializer<DataType, Passthrough> {

}
`
            )
          })

          context('optional', () => {
            it('omits it from the attributes', () => {
              const res = generateSerializerContent({
                fullyQualifiedModelName: 'user',
                columnsWithTypes: ['organization:belongs_to:optional'],
              })

              expect(res).toEqual(
                `\
import { Attribute, DreamColumn, DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute(User)
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object,
> extends UserSummarySerializer<DataType, Passthrough> {

}
`
              )
            })
          })
        })

        context('has_one', () => {
          it('omits it from the attributes', () => {
            const res = generateSerializerContent({
              fullyQualifiedModelName: 'user',
              columnsWithTypes: ['organization:has_one'],
            })

            expect(res).toEqual(
              `\
import { Attribute, DreamColumn, DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute(User)
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object,
> extends UserSummarySerializer<DataType, Passthrough> {

}
`
            )
          })
        })

        context('has_many', () => {
          it('omits it from the attributes', () => {
            const res = generateSerializerContent({
              fullyQualifiedModelName: 'user',
              columnsWithTypes: ['organization:has_many'],
            })

            expect(res).toEqual(
              `\
import { Attribute, DreamColumn, DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute(User)
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object,
> extends UserSummarySerializer<DataType, Passthrough> {

}
`
            )
          })
        })
      })
    })
  })
})

function expectAttributeType(startingAttributeType: string) {
  const res = generateSerializerContent({
    fullyQualifiedModelName: 'User',
    columnsWithTypes: [`howyadoin:${startingAttributeType}`],
  })
  expect(res).toEqual(
    `\
import { Attribute, DreamColumn, DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export class UserSummarySerializer<
  DataType extends User,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute(User)
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer<
  DataType extends User,
  Passthrough extends object,
> extends UserSummarySerializer<DataType, Passthrough> {
  @Attribute(User)
  public howyadoin: DreamColumn<User, 'howyadoin'>
}
`
  )
}
