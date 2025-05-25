import 'jest-extended'

import { provideDreamViteMatchers, truncate } from '@rvoh/dream-spec-helpers'
import { toBeOneOf } from 'jest-extended'
import { DreamApp } from '../../src/index.js'
import initializeDreamApp from '../../test-app/cli/helpers/initializeDreamApp.js'

provideDreamViteMatchers()
expect.extend({ toBeOneOf } as any)

beforeEach(async () => {
  try {
    await initializeDreamApp()
  } catch (err) {
    console.error(err)
    throw err
  }
  await truncate(DreamApp)
}, 15000)
