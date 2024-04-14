import truncate from '../../src/helpers/spec/helpers/truncate'
import '../../src/helpers/spec/jestMatchers'
import 'luxon-jest-matchers'

beforeEach(async () => {
  await truncate()
}, 15000)
