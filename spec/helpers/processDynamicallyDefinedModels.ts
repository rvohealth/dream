import Dream from '../../src/Dream.js'
import { validateStiChildAssociations } from '../../src/decorators/class/STI.js'

export default function processDynamicallyDefinedModels(...dreamClasses: (typeof Dream)[]) {
  Dream['globallyInitializingDecorators'] = true
  try {
    dreamClasses.forEach(modelClass => {
      new modelClass({}, { _internalUseOnly: true })
    })
    validateStiChildAssociations(dreamClasses)
  } finally {
    Dream['globallyInitializingDecorators'] = false
  }
}
