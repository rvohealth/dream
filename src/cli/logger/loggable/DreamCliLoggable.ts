import { DreamCliBgColor, DreamCliForegroundColor } from '../DreamCliLogger.js'
import colorize from './colorize.js'

export default class DreamCliLoggable {
  public permanent: boolean
  public logPrefix: string
  public logPrefixColor: DreamCliForegroundColor | undefined
  public logPrefixBgColor: DreamCliBgColor | undefined

  constructor({
    permanent,
    logPrefix = '✺',
    logPrefixColor,
    logPrefixBgColor,
  }: {
    permanent: boolean
    logPrefix?: string
    logPrefixColor?: DreamCliForegroundColor
    logPrefixBgColor?: DreamCliBgColor
  }) {
    this.permanent = permanent
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
