import { DreamCliBgColor, DreamCliForegroundColor } from '../../../types/logger.js'
import colorize from './colorize.js'

export default class DreamCliLoggable {
  public logPrefix: string
  public logPrefixColor: DreamCliForegroundColor | undefined
  public logPrefixBgColor: DreamCliBgColor | undefined

  constructor({
    logPrefix = '✺',
    logPrefixColor,
    logPrefixBgColor,
  }: {
    logPrefix?: string
    logPrefixColor?: DreamCliForegroundColor
    logPrefixBgColor?: DreamCliBgColor
  }) {
    this.logPrefix = logPrefix
    this.logPrefixColor = logPrefixColor
    this.logPrefixBgColor = logPrefixBgColor
  }

  public render(): void {
    throw new Error('define in base class')
  }

  public get colorizedLogPrefix() {
    return colorize(this.logPrefix, { color: this.logPrefixColor, bgColor: this.logPrefixBgColor })
  }
}
