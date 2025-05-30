import generateFactoryContent from '../../../src/helpers/cli/generateFactoryContent.js'

describe('dream generate:model <name> [...attributes] (factory context)', () => {
  context('when provided with a pascalized table name', () => {
    it('generates a factory with the given name', () => {
      const res = generateFactoryContent({ fullyQualifiedModelName: 'User', columnsWithTypes: [] })
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvoh/dream'
import User from '../../app/models/User.js'

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
          'name:citext',
          'title:string',
          'body:text',
          'type:enum:post_type:WeeklyPost,GuestPost',
        ],
      })
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvoh/dream'
import Post from '../../app/models/Post.js'

let counter = 0

export default async function createPost(attrs: UpdateableProperties<Post> = {}) {
  return await Post.create({
    name: \`Post name \${++counter}\`,
    title: \`Post title \${counter}\`,
    body: \`Post body \${counter}\`,
    type: 'WeeklyPost',
    ...attrs,
  })
}
`
      )
    })

    context('that end with "_type"', () => {
      it('omits the default', () => {
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
import Post from '../../app/models/Post.js'

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
import MyNestedUser from '../../../../app/models/My/Nested/User.js'

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
    it('includes includes automatic creation of associations', () => {
      const res = generateFactoryContent({
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: ['name:string', 'User:belongs_to'],
      })
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvoh/dream'
import Post from '../../app/models/Post.js'
import createUser from './UserFactory.js'

let counter = 0

export default async function createPost(attrs: UpdateableProperties<Post> = {}) {
  return await Post.create({
    user: await createUser(),
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
import MyNestedUser from '../../../../app/models/My/Nested/User.js'
import createMyNestedDoubleNestedOrganization from './DoubleNested/OrganizationFactory.js'

let counter = 0

export default async function createMyNestedUser(attrs: UpdateableProperties<MyNestedUser> = {}) {
  return await MyNestedUser.create({
    myNestedDoubleNestedOrganization: await createMyNestedDoubleNestedOrganization(),
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
