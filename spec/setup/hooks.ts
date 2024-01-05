import truncate from '../helpers/truncate'
import './jestMatchers'
import 'luxon-jest-matchers'

beforeEach(async () => {
  await truncate()
}, 15000)
