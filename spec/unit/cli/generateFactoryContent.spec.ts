import generateFactoryContent from '../../../src/helpers/cli/generateFactoryContent'

describe('dream generate:model <name> [...attributes] (factory context)', () => {
  context('when provided with a pascalized table name', () => {
    it('generates a factory with the given name', () => {
      const res = generateFactoryContent('User', [])
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvohealth/dream'
import User from '../../app/models/User'

export default async function createUser(overrides: UpdateableProperties<User> = {}) {
  return await User.create({
    ...overrides,
  })
}`
      )
    })
  })

  context('with a nested name', () => {
    it('applies nesting to name and directory structure', () => {
      const res = generateFactoryContent('My/Nested/User', [])
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvohealth/dream'
import User from '../../../../app/models/My/Nested/User'

export default async function createUser(overrides: UpdateableProperties<User> = {}) {
  return await User.create({
    ...overrides,
  })
}`
      )
    })
  })

  context('with belongs_to attributes', () => {
    it('includes belongs to attributes as preliminary arguments before overrides', () => {
      const res = generateFactoryContent('My/Nested/User', [
        'name:string',
        'My/Nested/DoubleNested/Organization:belongs_to',
      ])
      expect(res).toEqual(
        `\
import { UpdateableProperties } from '@rvohealth/dream'
import User from '../../../../app/models/My/Nested/User'
import Organization from '../../../../../app/models/My/Nested/DoubleNested/Organization'

export default async function createUser(organization: Organization, overrides: UpdateableProperties<User> = {}) {
  return await User.create({
    organization,
    ...overrides,
  })
}`
      )
    })
  })
})
