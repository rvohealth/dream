import { Spinner } from 'yocto-spinner'
import { DreamCliBgColor, DreamCliForegroundColor } from '../DreamCliLogger.js'
import createSpinner from '../helpers/createSpinner.js'
import DreamCliLoggable from './DreamCliLoggable.js'
import spinners from './spinners.js'
import DreamCLI from '../../index.js'

export default class DreamCliLoggableSpinner extends DreamCliLoggable {
  private text: string
  private spinner: keyof typeof spinners
  private currentIndex: number = 0
  private color: DreamCliForegroundColor | undefined
  private bgColor: DreamCliBgColor | undefined
  private lastRender: Date | undefined
  private _spinner: Spinner

  constructor({
    text,
    permanent,
    spinner,
    color,
    bgColor,
  }: {
    text: string
    permanent: boolean
    spinner: keyof typeof spinners
    color?: DreamCliForegroundColor
    bgColor?: DreamCliBgColor
  }) {
    super({ permanent })
    this.text = text
    this.spinner = spinner
    this.color = color
    this.bgColor = bgColor
  }

  public render() {
    this._spinner?.stop()
    this._spinner = createSpinner(this.text, this.spinner)
  }

  public stop(message: string = this.text + ' done!') {
    this._spinner.stop()
    DreamCLI.logger.purge()
    DreamCLI.logger.log(message, { permanent: true })
  }
}
