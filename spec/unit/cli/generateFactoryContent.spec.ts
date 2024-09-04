import generateFactoryContent from '../../../src/helpers/cli/generateFactoryContent'

describe('dream generate:model <name> [...attributes] (factory context)', () => {
  context('when provided with a pascalized table name', () => {
    it('generates a factory with the given name', () => {
      const res = generateFactoryContent('User', [])
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvohealth/dream'
import User from '../../app/models/User'

export default async function createUser(attrs: UpdateableProperties<User> = {}) {
  return await User.create(attrs)
}
`
      )
    })
  })

  context('with attrs', () => {
    it('defaults are provided when not supplied', () => {
      const res = generateFactoryContent('Post', [
        'title:string',
        'body:text',
        'type:enum:post_type:WeeklyPost,GuestPost',
      ])
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvohealth/dream'
import Post from '../../app/models/Post'

let counter = 0

export default async function createPost(attrs: UpdateableProperties<Post> = {}) {
  attrs.title ||= \`Post title \${counter++}\`
  attrs.body ||= \`Post body \${counter}\`
  attrs.type ||= 'WeeklyPost'
  return await Post.create(attrs)
}
`
      )
    })
  })

  context('with a nested name', () => {
    it('applies nesting to name and directory structure', () => {
      const res = generateFactoryContent('My/Nested/User', [])
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvohealth/dream'
import MyNestedUser from '../../../../app/models/My/Nested/User'

export default async function createMyNestedUser(attrs: UpdateableProperties<MyNestedUser> = {}) {
  return await MyNestedUser.create(attrs)
}
`
      )
    })
  })

  context('with belongs_to attrs', () => {
    it('includes includes automatic creation of associations', () => {
      const res = generateFactoryContent('Post', ['name:string', 'User:belongs_to'])
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvohealth/dream'
import Post from '../../app/models/Post'
import User from '../../app/models/User'
import createUser from './UserFactory'

let counter = 0

export default async function createPost(attrs: UpdateableProperties<Post> = {}) {
  attrs.user ||= createUser()
  attrs.name ||= \`Post name \${counter++}\`
  return await Post.create(attrs)
}
`
      )
    })

    context('with nesting', () => {
      it('includes includes automatic creation of associations', () => {
        const res = generateFactoryContent('My/Nested/User', [
          'name:string',
          'My/Nested/DoubleNested/Organization:belongs_to',
        ])
        expect(res).toEqual(
          `\
import { UpdateableProperties } from '@rvohealth/dream'
import MyNestedUser from '../../../../app/models/My/Nested/User'
import MyNestedDoubleNestedOrganization from '../../../../app/models/My/Nested/DoubleNested/Organization'
import createMyNestedDoubleNestedOrganization from './DoubleNested/OrganizationFactory'

let counter = 0

export default async function createMyNestedUser(attrs: UpdateableProperties<MyNestedUser> = {}) {
  attrs.myNestedDoubleNestedOrganization ||= createMyNestedDoubleNestedOrganization()
  attrs.name ||= \`My/Nested/User name \${counter++}\`
  return await MyNestedUser.create(attrs)
}
`
        )
      })
    })
  })
})
