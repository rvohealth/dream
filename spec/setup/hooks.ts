import 'jest-extended'
import 'luxon-jest-matchers'

import { provideDreamViteMatchers, truncate } from '@rvoh/dream-spec-helpers'
import { toBeOneOf } from 'jest-extended'
import { DreamApplication } from '../../src.js'
import initializeDreamApplication from '../../test-app/cli/helpers/initializeDreamApplication.js'

provideDreamViteMatchers()
expect.extend({ toBeOneOf } as any)

beforeEach(async () => {
  try {
    await initializeDreamApplication()
  } catch (err) {
    console.error(err)
    throw err
  }
  await truncate(DreamApplication)
}, 15000)
