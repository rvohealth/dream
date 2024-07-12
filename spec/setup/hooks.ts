import 'jest-extended'
import { toBeOneOf } from 'jest-extended'
import 'luxon-jest-matchers'
import '../../spec-helpers/jestMatchers'
import truncate from '../../spec-helpers/truncate'

expect.extend({ toBeOneOf } as any)

beforeEach(async () => {
  await truncate()
}, 15000)
