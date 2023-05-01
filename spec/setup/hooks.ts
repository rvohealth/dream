import truncate from '../helpers/truncate'
import './jestMatchers'

beforeEach(async () => {
  await truncate()
})
