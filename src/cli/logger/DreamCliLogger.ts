import { DreamCliLoggerLogOpts } from '../../types/logger.js'
import DreamCliLoggableText from './loggable/DreamCliLoggableText.js'

export default class DreamCliLogger {
  public log(text: string, { logPrefix, logPrefixColor, logPrefixBgColor }: DreamCliLoggerLogOpts = {}) {
    const loggable = new DreamCliLoggableText(text, {
      logPrefix,
      logPrefixColor: logPrefixColor || 'green',
      logPrefixBgColor,
    })

    loggable.render()
  }

  public logStartProgress(
    text: string,
    { logPrefix = '✺ ┌', logPrefixColor, logPrefixBgColor }: DreamCliLoggerLogOpts = {}
  ) {
    this.log(text, { logPrefix, logPrefixColor, logPrefixBgColor })
  }

  public logContinueProgress(
    text: string,
    { logPrefix = '  ├', logPrefixColor, logPrefixBgColor }: DreamCliLoggerLogOpts = {}
  ) {
    this.log(text, { logPrefix, logPrefixColor, logPrefixBgColor })
  }

  public logEndProgress(
    text: string = 'complete',
    { logPrefix = '  └', logPrefixColor, logPrefixBgColor }: DreamCliLoggerLogOpts = {}
  ) {
    this.log(text, { logPrefix, logPrefixColor, logPrefixBgColor })
  }
}
