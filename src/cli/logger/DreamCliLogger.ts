import c from 'yoctocolors'
import { DreamCliLoggerLogOpts } from '../../types/logger.js'
import DreamCliLoggableText from './loggable/DreamCliLoggableText.js'

const SPINNER_FRAMES = ['✺', '✹', '✸', '✷', '✶', '✵', '✴', '✵', '✶', '✷', '✸', '✹']
const EYE_FRAMES = ['─', '◡', '◯', '◉', '●', '◉', '◯', '◡']
const SPINNER_INTERVAL_MS = 200

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

interface SpinnerState {
  actionText: string
  startTime: number
  frameIndex: number
  interval: ReturnType<typeof setInterval>
  committed: boolean
}

export default class DreamCliLogger {
  private spinner: SpinnerState | null = null

  public log(text: string, { logPrefix, logPrefixColor, logPrefixBgColor }: DreamCliLoggerLogOpts = {}) {
    const loggable = new DreamCliLoggableText(text, {
      logPrefix,
      logPrefixColor: logPrefixColor || 'greenBright',
      logPrefixBgColor,
    })

    loggable.render()
  }

  public async logProgress(
    text: string,
    cb: () => void | Promise<void>,
    { logPrefix = '✺ ┌', logPrefixColor, logPrefixBgColor }: DreamCliLoggerLogOpts = {}
  ) {
    this.logStartProgress(text, { logPrefix, logPrefixColor, logPrefixBgColor })
    await cb()
    this.logEndProgress()
  }

  public logStartProgress(text: string, { logPrefixColor, logPrefixBgColor }: DreamCliLoggerLogOpts = {}) {
    if (!process.stdout.isTTY) {
      this.log(text, { logPrefix: '✺ ┌', logPrefixColor: logPrefixColor || 'greenBright', logPrefixBgColor })
      return
    }

    this.startTopSpinner(text)
  }

  private startTopSpinner(text: string) {
    const renderFrame = (frameIndex: number) => {
      const star = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length]
      process.stdout.write(`${this.escapeSequence('clearLine')}${c.yellow(`${star} ┌`)} ${c.yellow(text)}`)
    }

    renderFrame(0)

    const interval = setInterval(() => {
      if (this.spinner && !this.spinner.committed) {
        this.spinner.frameIndex++
        renderFrame(this.spinner.frameIndex)
      }
    }, SPINNER_INTERVAL_MS)

    this.spinner = {
      actionText: text,
      startTime: Date.now(),
      frameIndex: 0,
      interval,
      committed: false,
    }
  }

  private startBottomSpinner() {
    if (!process.stdout.isTTY || !this.spinner) return

    const renderFrame = (frameIndex: number) => {
      const eye = EYE_FRAMES[frameIndex % EYE_FRAMES.length]
      process.stdout.write(
        `${this.escapeSequence('clearLine')}${c.yellow(eye!)} ${c.yellow(`└ ${this.spinner!.actionText}`)}`
      )
    }

    this.spinner.frameIndex = 0
    renderFrame(0)

    this.spinner.interval = setInterval(() => {
      if (this.spinner) {
        this.spinner.frameIndex++
        renderFrame(this.spinner.frameIndex)
      }
    }, SPINNER_INTERVAL_MS)
  }

  public logContinueProgress(
    text: string,
    { logPrefix = '  ├', logPrefixColor, logPrefixBgColor }: DreamCliLoggerLogOpts = {}
  ) {
    if (this.spinner && !this.spinner.committed) {
      clearInterval(this.spinner.interval)

      // Overwrite the yellow animated header with green past-tense text before marking
      // the spinner as committed
      process.stdout.write(
        `${this.escapeSequence('clearLine')}${c.greenBright('✺ ┌')} ${c.greenBright(this.spinner.actionText)}\n`
      )
      this.spinner.committed = true

      this.log(text, { logPrefix, logPrefixColor, logPrefixBgColor })
      this.startBottomSpinner()
    } else if (this.spinner?.committed) {
      // Clear the bottom running... spinner, log sub-line, then re-show it
      clearInterval(this.spinner.interval)
      this.clearLine()

      this.log(text, { logPrefix, logPrefixColor, logPrefixBgColor })
      this.startBottomSpinner()
    } else {
      this.log(text, { logPrefix, logPrefixColor, logPrefixBgColor })
    }
  }

  public logEndProgress(
    text: string = 'complete',
    { logPrefix = '  └', logPrefixColor, logPrefixBgColor }: DreamCliLoggerLogOpts = {}
  ) {
    if (!this.spinner) {
      this.log(text, { logPrefix, logPrefixColor, logPrefixBgColor })
      return
    }

    const spinner = this.spinner
    this.spinner = null
    clearInterval(spinner.interval)

    const elapsed = Date.now() - spinner.startTime
    const elapsedStr = formatElapsed(elapsed)

    if (!spinner.committed) {
      // No sub-lines: overwrite the spinner in-place with the green completed header
      process.stdout.write(
        `${this.escapeSequence('clearLine')}${c.greenBright('✺ ┌')} ${c.greenBright(spinner.actionText)}\n`
      )
    } else {
      // Has sub-lines: clear the bottom running... spinner line
      if (process.stdout.isTTY) this.clearLine()
    }

    this.log(c.greenBright(`done in ${elapsedStr}\n`), {
      logPrefix,
      logPrefixColor: logPrefixColor || 'greenBright',
      logPrefixBgColor,
    })
  }

  private clearLine() {
    process.stdout.write(this.escapeSequence('clearLine'))
  }

  private escapeSequence(sequence: 'clearLine') {
    switch (sequence) {
      case 'clearLine':
        return `\r\x1b[2K`

      default:
        throw new Error(`unexpected sequence: ${sequence as string}`)
    }
  }
}
