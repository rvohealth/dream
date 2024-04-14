import truncate from '../../spec-helpers/truncate'
import '../../spec-helpers/jestMatchers'
import 'luxon-jest-matchers'

beforeEach(async () => {
  await truncate()
}, 15000)
