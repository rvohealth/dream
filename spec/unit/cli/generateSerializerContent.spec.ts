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
import { DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export const UserSummarySerializer = (user: User) =>
  DreamSerializer(User, user)
    .attribute('id')

export const UserSerializer = (user: User) =>
  UserSummarySerializer(user)
    .attribute('loggedInAt')
`
        )
      })
    })

    context('when stiBaseSerializer: true (STI parent)', () => {
      it('alters the serializer to include a generic', () => {
        const res = generateSerializerContent({
          fullyQualifiedModelName: 'Balloon',
          columnsWithTypes: ['hello'],
          stiBaseSerializer: true,
        })

        expect(res).toEqual(
          `\
import { DreamSerializer, DreamSerializerBuilder } from '@rvoh/dream'
import Balloon from '../models/Balloon.js'

export const BalloonSummarySerializer = <T extends Balloon>(StiChildClass: typeof Balloon, balloon: T) =>
  (DreamSerializer(StiChildClass, balloon) as unknown as DreamSerializerBuilder<typeof Balloon, Balloon>)
    .attribute('id') as unknown as DreamSerializerBuilder<typeof Balloon, T>

export const BalloonSerializer = <T extends Balloon>(StiChildClass: typeof Balloon, balloon: T) =>
  (BalloonSummarySerializer(StiChildClass, balloon) as unknown as DreamSerializerBuilder<typeof Balloon, Balloon>)
    .attribute('hello') as unknown as DreamSerializerBuilder<typeof Balloon, T>
`
        )
      })
    })

    context('when parentName is included (STI child)', () => {
      it('the serializers extend the parent serializers, summary omits id', () => {
        const res = generateSerializerContent({
          fullyQualifiedModelName: 'Foo/Bar/Baz',
          columnsWithTypes: ['world'],
          fullyQualifiedParentName: 'Foo/Bar',
        })

        expect(res).toEqual(
          `\
import FooBarSerializer, { FooBarSummarySerializer } from '../BarSerializer.js'
import FooBarBaz from '../../../models/Foo/Bar/Baz.js'

export const FooBarBazSummarySerializer = (fooBarBaz: FooBarBaz) =>
  FooBarSummarySerializer(FooBarBaz, fooBarBaz)

export const FooBarBazSerializer = (fooBarBaz: FooBarBaz) =>
  FooBarSerializer(FooBarBaz, fooBarBaz)
    .attribute('world')
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
import { DreamSerializer } from '@rvoh/dream'
import UserAdmin from '../../models/User/Admin.js'

export const UserAdminSummarySerializer = (userAdmin: UserAdmin) =>
  DreamSerializer(UserAdmin, userAdmin)
    .attribute('id')

export const UserAdminSerializer = (userAdmin: UserAdmin) =>
  UserAdminSummarySerializer(userAdmin)
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
        it('renders it using attribute with an openapi specification', () => {
          expectJsonAttributeType('json')
        })
      })

      context('one of those attributes is jsonb', () => {
        it('renders it using attribute with an openapi specification', () => {
          expectJsonAttributeType('jsonb')
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
import { DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export const UserSummarySerializer = (user: User) =>
  DreamSerializer(User, user)
    .attribute('id')

export const UserSerializer = (user: User) =>
  UserSummarySerializer(user)
    .attribute('howyadoin', { precision: 2 })
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
          expectAttributeType('enum:topping:cheese,baja_sauce')
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
import { DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export const UserSummarySerializer = (user: User) =>
  DreamSerializer(User, user)
    .attribute('id')

export const UserSerializer = (user: User) =>
  UserSummarySerializer(user)
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
import { DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export const UserSummarySerializer = (user: User) =>
  DreamSerializer(User, user)
    .attribute('id')

export const UserSerializer = (user: User) =>
  UserSummarySerializer(user)
    .attribute('howyadoin')
`
  )
}

function expectJsonAttributeType(startingAttributeType: 'json' | 'jsonb' | 'json[]' | 'jsonb[]') {
  const res = generateSerializerContent({
    fullyQualifiedModelName: 'User',
    columnsWithTypes: [`howyadoin:${startingAttributeType}`],
  })
  expect(res).toEqual(
    `\
import { DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

export const UserSummarySerializer = (user: User) =>
  DreamSerializer(User, user)
    .attribute('id')

export const UserSerializer = (user: User) =>
  UserSummarySerializer(user)
    .attribute('howyadoin', { openapi: { type: 'object', properties: { } } })
`
  )
}
