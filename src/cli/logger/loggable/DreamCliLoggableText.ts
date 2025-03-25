import { DreamCliBgColor, DreamCliForegroundColor } from '../../../types/logger.js'
import colorize from './colorize.js'
import DreamCliLoggable from './DreamCliLoggable.js'

export default class DreamCliLoggableText extends DreamCliLoggable {
  private color: DreamCliForegroundColor | undefined
  private bgColor: DreamCliBgColor | undefined

  constructor(
    private text: string,
    {
      logPrefix,
      color,
      bgColor,
      logPrefixColor,
      logPrefixBgColor,
    }: {
      logPrefix?: string
      color?: DreamCliForegroundColor
      bgColor?: DreamCliBgColor
      logPrefixColor?: DreamCliForegroundColor
      logPrefixBgColor?: DreamCliBgColor
    }
  ) {
    super({ logPrefix })
    this.color = color
    this.bgColor = bgColor
    this.logPrefixColor = logPrefixColor
    this.logPrefixBgColor = logPrefixBgColor
  }

  public render() {
    console.log(
      `${this.colorizedLogPrefix} ${colorize(this.text, { color: this.color, bgColor: this.bgColor })}`
    )
  }
}
