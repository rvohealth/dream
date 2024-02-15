import truncate from '../../shared/spec/helpers/truncate'
import '../../shared/spec/jestMatchers'
import 'luxon-jest-matchers'

beforeEach(async () => {
  await truncate()
}, 15000)
