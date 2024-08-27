import * as readline from 'readline'
const input = process.stdin

export default class Prompt {
  private question: string
  private cb: ((answer: string) => void) | null = null

  constructor(question: string) {
    this.question = question
  }

  public async run(): Promise<string> {
    await this.init()
    return new Promise(accept => {
      this.cb = accept as any
    })
  }

  private async init() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question(this.question + '\n', res => {
      this.cb?.(res)
      rl.close()
    })
  }

  public close = () => {
    input.setRawMode(false)
    input.pause()
    process.exit(0)
  }
}
