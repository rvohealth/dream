import 'jest-extended'
import 'luxon-jest-matchers'
import '../../spec-helpers/jestMatchers'

import { toBeOneOf } from 'jest-extended'
import truncate from '../../spec-helpers/truncate'
import initializeDreamApplication from '../../test-app/cli/helpers/initializeDreamApplication'

expect.extend({ toBeOneOf } as any)

beforeEach(async () => {
  try {
    await initializeDreamApplication()
  } catch (err) {
    console.error(err)
    throw err
  }
  await truncate()
}, 15000)
