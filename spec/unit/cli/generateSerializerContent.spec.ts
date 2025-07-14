import generateSerializerContent from '../../../src/helpers/cli/generateSerializerContent.js'

describe('dream generate:serializer <name> [...attributes]', () => {
  context('when provided attributes', () => {
    context('when passed a dream class', () => {
      it('generates a serializer adding requested attributes, casting the serializer type to the specified model', () => {
        const res = generateSerializerContent({
          fullyQualifiedModelName: 'Post',
          columnsWithTypes: ['title:string', 'bodyMarkdown:text'],
          stiBaseSerializer: false,
          includeAdminSerializers: false,
        })

        expect(res).toEqual(
          `\
import { DreamSerializer } from '@rvoh/dream'
import Post from '../models/Post.js'

export const PostSummarySerializer = (post: Post) =>
  DreamSerializer(Post, post)
    .attribute('id')

export const PostSerializer = (post: Post) =>
  PostSummarySerializer(post)
    .attribute('title')
    .attribute('bodyMarkdown')
`
        )
      })
    })

    context('includeAdminSerializers: true', () => {
      it('generates admin serializers', () => {
        const res = generateSerializerContent({
          fullyQualifiedModelName: 'Article',
          columnsWithTypes: ['body:text'],
          stiBaseSerializer: false,
          includeAdminSerializers: true,
        })

        expect(res).toEqual(
          `\
import { DreamSerializer } from '@rvoh/dream'
import Article from '../models/Article.js'

export const ArticleSummarySerializer = (article: Article) =>
  DreamSerializer(Article, article)
    .attribute('id')

export const ArticleSerializer = (article: Article) =>
  ArticleSummarySerializer(article)
    .attribute('body')

export const ArticleAdminSummarySerializer = (article: Article) =>
  DreamSerializer(Article, article)
    .attribute('id')

export const ArticleAdminSerializer = (article: Article) =>
  ArticleAdminSummarySerializer(article)
    .attribute('body')
`
        )
      })
    })

    context('when stiBaseSerializer: true (STI parent)', () => {
      it('alters the serializer to include a generic', () => {
        const res = generateSerializerContent({
          fullyQualifiedModelName: 'Balloon',
          columnsWithTypes: ['hello', 'type:enum:balloon_types:Mylar,Latex'],
          stiBaseSerializer: true,
          includeAdminSerializers: false,
        })

        expect(res).toEqual(
          `\
import { DreamSerializer } from '@rvoh/dream'
import Balloon from '../models/Balloon.js'

export const BalloonSummarySerializer = <T extends Balloon>(StiChildClass: typeof Balloon, balloon: T) =>
  DreamSerializer(StiChildClass ?? Balloon, balloon)
    .attribute('id')

export const BalloonSerializer = <T extends Balloon>(StiChildClass: typeof Balloon, balloon: T) =>
  BalloonSummarySerializer(StiChildClass, balloon)
    .attribute('hello')
    .attribute('type', { openapi: { type: 'string', enum: [StiChildClass.sanitizedName] } })
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
          stiBaseSerializer: false,
          includeAdminSerializers: false,
        })

        expect(res).toEqual(
          `\
import { FooBarSerializer, FooBarSummarySerializer } from '../BarSerializer.js'
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

    context('when passed a nested model class', () => {
      it(
        'correctly injects extra updirs to account for nested paths, but leaves ' +
          'the class name as just the model name + Serializer/SummarySerializer so that ' +
          'the serializers getter in the model does not replicate the nesting structure twice',
        () => {
          const res = generateSerializerContent({
            fullyQualifiedModelName: 'User/Admin',
            stiBaseSerializer: false,
            includeAdminSerializers: false,
          })

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

      context('includeAdminSerializers: true', () => {
        it('generates admin serializers with the correct names', () => {
          const res = generateSerializerContent({
            fullyQualifiedModelName: 'Article/Comment',
            stiBaseSerializer: false,
            includeAdminSerializers: true,
          })

          expect(res).toEqual(
            `\
import { DreamSerializer } from '@rvoh/dream'
import ArticleComment from '../../models/Article/Comment.js'

export const ArticleCommentSummarySerializer = (articleComment: ArticleComment) =>
  DreamSerializer(ArticleComment, articleComment)
    .attribute('id')

export const ArticleCommentSerializer = (articleComment: ArticleComment) =>
  ArticleCommentSummarySerializer(articleComment)

export const ArticleCommentAdminSummarySerializer = (articleComment: ArticleComment) =>
  DreamSerializer(ArticleComment, articleComment)
    .attribute('id')

export const ArticleCommentAdminSerializer = (articleComment: ArticleComment) =>
  ArticleCommentAdminSummarySerializer(articleComment)
`
          )
        })
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
            stiBaseSerializer: false,
            includeAdminSerializers: false,
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
              stiBaseSerializer: false,
              includeAdminSerializers: false,
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
    stiBaseSerializer: false,
    includeAdminSerializers: false,
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
    stiBaseSerializer: false,
    includeAdminSerializers: false,
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
