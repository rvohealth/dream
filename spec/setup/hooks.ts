import 'jest-extended'
import 'luxon-jest-matchers'

import { truncate } from '@rvohealth/dream-spec-helpers'
import { toBeOneOf } from 'jest-extended'
import { DreamApplication } from '../../src'
import initializeDreamApplication from '../../test-app/cli/helpers/initializeDreamApplication'
import { provideDreamViteMatchers } from '@rvohealth/dream-spec-helpers'

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
