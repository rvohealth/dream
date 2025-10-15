import generateFactoryContent from '../../../src/helpers/cli/generateFactoryContent.js'
import { DreamApp } from '../../../src/index.js'

describe('dream generate:model <name> [...attributes] (factory context)', () => {
  context('when provided with a pascalized table name', () => {
    it('generates a factory with the given name', () => {
      const res = generateFactoryContent({ fullyQualifiedModelName: 'User', columnsWithTypes: [] })
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvoh/dream'
import User from '@models/User.js'

export default async function createUser(attrs: UpdateableProperties<User> = {}) {
  return await User.create({
    ...attrs,
  })
}
`
      )
    })
  })

  context('with attrs', () => {
    it('defaults are provided when not supplied', () => {
      const res = generateFactoryContent({
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: [
          'type:enum:post_type:WeeklyPost,GuestPost',
          'style:enum:building_style:formal,informal',
          'title:citext',
          'subtitle:string',
          'body_markdown:text',
          'rating:decimal:3,2',
          'ratings:integer',
          'big_rating:bigint',
          'signed_on:date',
          'signed_at:datetime',
        ],
      })
      expect(res).toEqual(
        `\
import { UpdateableProperties, CalendarDate, DateTime } from '@rvoh/dream'
import Post from '@models/Post.js'

let counter = 0

export default async function createPost(attrs: UpdateableProperties<Post> = {}) {
  return await Post.create({
    type: 'WeeklyPost',
    style: 'formal',
    title: \`Post title \${++counter}\`,
    subtitle: \`Post subtitle \${counter}\`,
    bodyMarkdown: \`Post bodyMarkdown \${counter}\`,
    rating: 1.1,
    ratings: 1,
    bigRating: '11111111111111111',
    signedOn: CalendarDate.today(),
    signedAt: DateTime.now(),
    ...attrs,
  })
}
`
      )
    })

    context('with array attrs', () => {
      it('defaults are provided when not supplied', () => {
        const res = generateFactoryContent({
          fullyQualifiedModelName: 'Post',
          columnsWithTypes: [
            'types:enum[]:post_type:WeeklyPost,GuestPost',
            'styles:enum[]:building_style:formal,informal',
            'titles:citext[]',
            'subtitles:string[]',
            'body_markdowns:text[]',
            'ratings:decimal[]:3,2',
            'ratingInts:integer[]',
            'big_ratings:bigint[]',
            'signed_ons:date[]',
            'signed_ats:datetime[]',
          ],
        })
        expect(res).toEqual(
          `\
import { UpdateableProperties, CalendarDate, DateTime } from '@rvoh/dream'
import Post from '@models/Post.js'

let counter = 0

export default async function createPost(attrs: UpdateableProperties<Post> = {}) {
  return await Post.create({
    types: ['WeeklyPost'],
    styles: ['formal'],
    titles: [\`Post titles \${++counter}\`],
    subtitles: [\`Post subtitles \${counter}\`],
    bodyMarkdowns: [\`Post bodyMarkdowns \${counter}\`],
    ratings: [1.1],
    ratingInts: [1],
    bigRatings: ['11111111111111111'],
    signedOns: [CalendarDate.today()],
    signedAts: [DateTime.now()],
    ...attrs,
  })
}
`
        )
      })
    })

    it('defaults are omitted for optional arguments', () => {
      const res = generateFactoryContent({
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: [
          'type:enum:post_type:WeeklyPost,GuestPost:optional',
          'style:enum:building_style:formal,informal:optional',
          'title:citext:optional',
          'subtitle:string:optional',
          'body_markdown:text:optional',
          'rating:decimal:3,2:optional',
          'ratings:integer:optional',
          'big_rating:bigint:optional',
          'signed_on:date:optional',
          'signed_at:datetime:optional',
        ],
      })
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvoh/dream'
import Post from '@models/Post.js'

export default async function createPost(attrs: UpdateableProperties<Post> = {}) {
  return await Post.create({
    ...attrs,
  })
}
`
      )
    })

    context('when the counter is not used to modify any of the default values', () => {
      it('the counter variable is omitted', () => {
        const res = generateFactoryContent({
          fullyQualifiedModelName: 'Post',
          columnsWithTypes: [
            'type:enum:post_type:WeeklyPost,GuestPost',
            'style:enum:building_style:formal,informal',
            'rating:decimal:3,2',
            'ratings:integer',
            'big_rating:bigint',
          ],
        })
        expect(res).toEqual(
          `\
import { UpdateableProperties } from '@rvoh/dream'
import Post from '@models/Post.js'

export default async function createPost(attrs: UpdateableProperties<Post> = {}) {
  return await Post.create({
    type: 'WeeklyPost',
    style: 'formal',
    rating: 1.1,
    ratings: 1,
    bigRating: '11111111111111111',
    ...attrs,
  })
}
`
        )
      })
    })

    context('polymorphic attributes (_id and _type)', () => {
      it('omit default values', () => {
        const res = generateFactoryContent({
          fullyQualifiedModelName: 'Post',
          columnsWithTypes: [
            'localizable_id:bigint',
            'localizable_type:enum:localized_types:Host,Place,Room',
          ],
        })
        expect(res).toEqual(
          `\
import { UpdateableProperties } from '@rvoh/dream'
import Post from '@models/Post.js'

export default async function createPost(attrs: UpdateableProperties<Post> = {}) {
  return await Post.create({
    ...attrs,
  })
}
`
        )
      })
    })
  })

  context('with a nested name', () => {
    it('applies nesting to name and directory structure', () => {
      const res = generateFactoryContent({ fullyQualifiedModelName: 'My/Nested/User', columnsWithTypes: [] })
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvoh/dream'
import MyNestedUser from '@models/My/Nested/User.js'

export default async function createMyNestedUser(attrs: UpdateableProperties<MyNestedUser> = {}) {
  return await MyNestedUser.create({
    ...attrs,
  })
}
`
      )
    })
  })

  context('with belongs_to attrs', () => {
    it('conditionally creates a default associated model iff an associated model is not provided', () => {
      const res = generateFactoryContent({
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: ['name:string', 'User:belongs_to'],
      })
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvoh/dream'
import Post from '@models/Post.js'
import createUser from '@spec/factories/UserFactory.js'

let counter = 0

export default async function createPost(attrs: UpdateableProperties<Post> = {}) {
  return await Post.create({
    user: attrs.user ? null : await createUser(),
    name: \`Post name \${++counter}\`,
    ...attrs,
  })
}
`
      )
    })

    context('with nesting', () => {
      it('includes includes automatic creation of associations', () => {
        const res = generateFactoryContent({
          fullyQualifiedModelName: 'My/Nested/User',
          columnsWithTypes: ['name:string', 'My/Nested/DoubleNested/Organization:belongs_to'],
        })
        expect(res).toEqual(
          `\
import { UpdateableProperties } from '@rvoh/dream'
import MyNestedUser from '@models/My/Nested/User.js'
import createMyNestedDoubleNestedOrganization from '@spec/factories/My/Nested/DoubleNested/OrganizationFactory.js'

let counter = 0

export default async function createMyNestedUser(attrs: UpdateableProperties<MyNestedUser> = {}) {
  return await MyNestedUser.create({
    organization: attrs.organization ? null : await createMyNestedDoubleNestedOrganization(),
    name: \`My/Nested/User name \${++counter}\`,
    ...attrs,
  })
}
`
        )
      })
    })
  })

  context('importExtension is set on DreamApp', () => {
    context('importExtension=.js', () => {
      beforeEach(() => {
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('.js')
      })

      it('styles all imports to have .js suffix', () => {
        const res = generateFactoryContent({
          fullyQualifiedModelName: 'My/Nested/User',
          columnsWithTypes: ['name:string', 'My/Nested/DoubleNested/Organization:belongs_to'],
        })
        expect(res).toEqual(
          `\
import { UpdateableProperties } from '@rvoh/dream'
import MyNestedUser from '@models/My/Nested/User.js'
import createMyNestedDoubleNestedOrganization from '@spec/factories/My/Nested/DoubleNested/OrganizationFactory.js'

let counter = 0

export default async function createMyNestedUser(attrs: UpdateableProperties<MyNestedUser> = {}) {
  return await MyNestedUser.create({
    organization: attrs.organization ? null : await createMyNestedDoubleNestedOrganization(),
    name: \`My/Nested/User name \${++counter}\`,
    ...attrs,
  })
}
`
        )
      })
    })

    context('importExtension=.ts', () => {
      beforeEach(() => {
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('.ts')
      })

      it('styles all imports to have .ts suffix', () => {
        const res = generateFactoryContent({
          fullyQualifiedModelName: 'My/Nested/User',
          columnsWithTypes: ['name:string', 'My/Nested/DoubleNested/Organization:belongs_to'],
        })
        expect(res).toEqual(
          `\
import { UpdateableProperties } from '@rvoh/dream'
import MyNestedUser from '@models/My/Nested/User.ts'
import createMyNestedDoubleNestedOrganization from '@spec/factories/My/Nested/DoubleNested/OrganizationFactory.ts'

let counter = 0

export default async function createMyNestedUser(attrs: UpdateableProperties<MyNestedUser> = {}) {
  return await MyNestedUser.create({
    organization: attrs.organization ? null : await createMyNestedDoubleNestedOrganization(),
    name: \`My/Nested/User name \${++counter}\`,
    ...attrs,
  })
}
`
        )
      })
    })

    context('importExtension=none', () => {
      beforeEach(() => {
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('none')
      })

      it('styles all imports to have no suffix', () => {
        const res = generateFactoryContent({
          fullyQualifiedModelName: 'My/Nested/User',
          columnsWithTypes: ['name:string', 'My/Nested/DoubleNested/Organization:belongs_to'],
        })
        expect(res).toEqual(
          `\
import { UpdateableProperties } from '@rvoh/dream'
import MyNestedUser from '@models/My/Nested/User'
import createMyNestedDoubleNestedOrganization from '@spec/factories/My/Nested/DoubleNested/OrganizationFactory'

let counter = 0

export default async function createMyNestedUser(attrs: UpdateableProperties<MyNestedUser> = {}) {
  return await MyNestedUser.create({
    organization: attrs.organization ? null : await createMyNestedDoubleNestedOrganization(),
    name: \`My/Nested/User name \${++counter}\`,
    ...attrs,
  })
}
`
        )
      })
    })
  })
})
