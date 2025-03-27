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
      logPrefix?: string | undefined
      color?: DreamCliForegroundColor | undefined
      bgColor?: DreamCliBgColor | undefined
      logPrefixColor?: DreamCliForegroundColor | undefined
      logPrefixBgColor?: DreamCliBgColor | undefined
    }
  ) {
    super({ logPrefix })
    this.color = color
    this.bgColor = bgColor
    this.logPrefixColor = logPrefixColor
    this.logPrefixBgColor = logPrefixBgColor
  }

  public override render() {
    console.log(
      `${this.colorizedLogPrefix} ${colorize(this.text, { color: this.color, bgColor: this.bgColor })}`
    )
  }
}
