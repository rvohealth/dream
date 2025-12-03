import 'jest-extended'

import { provideDreamViteMatchers, truncate } from '@rvoh/dream-spec-helpers'
import { toBeOneOf } from 'jest-extended'
import Dream from '../../src/Dream.js'
import DreamApp from '../../src/dream-app/index.js'
import initializeDreamApp from '../../test-app/cli/helpers/initializeDreamApp.js'

Error.stackTraceLimit = 50

provideDreamViteMatchers(Dream)
expect.extend({ toBeOneOf } as any)

beforeEach(async () => {
  await initializeDreamApp()
  await Promise.all([truncate(DreamApp, 'default'), truncate(DreamApp, 'alternateConnection')])
}, 15000)
