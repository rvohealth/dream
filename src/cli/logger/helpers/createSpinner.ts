import yoctoSpinner from 'yocto-spinner'
import spinners from '../loggable/spinners.js'

export default function createSpinner(text: string, spinnerKey: keyof typeof spinners = 'noise') {
  return yoctoSpinner({
    text,
    spinner: {
      interval: spinners[spinnerKey].interval,
      frames: [...spinners[spinnerKey].frames],
    },
  }).start()
}
