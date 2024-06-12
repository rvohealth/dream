import 'jest-extended'
import truncate from '../../spec-helpers/truncate'
import '../../spec-helpers/jestMatchers'
import 'luxon-jest-matchers'
import * as matchers from 'jest-extended'

// add all jest-extended matchers
expect.extend(matchers as any)

beforeEach(async () => {
  await truncate()
}, 15000)
