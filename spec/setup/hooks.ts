import truncate from '../helpers/truncate'
import './jestMatchers/dreamModel'
import './jestMatchers/dreamModels'

beforeEach(async () => {
  await truncate()
})
