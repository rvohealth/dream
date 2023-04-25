import truncate from '../helpers/truncate'
import './jestMatchers/dreamModel'

beforeEach(async () => {
  await truncate()
})
