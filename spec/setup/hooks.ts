import 'jest-extended'
import { toBeOneOf } from 'jest-extended'
import 'luxon-jest-matchers'
import '../../spec-helpers/jestMatchers'
import truncate from '../../spec-helpers/truncate'
import { Dreamconf } from '../../src'

expect.extend({ toBeOneOf } as any)

beforeEach(async () => {
  await Dreamconf.configure()
  await truncate()
}, 15000)
