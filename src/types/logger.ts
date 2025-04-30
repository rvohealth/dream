export interface DreamCliLoggerLogOpts {
  logPrefix?: string | undefined
  logPrefixColor?: DreamCliForegroundColor | undefined
  logPrefixBgColor?: DreamCliBgColor | undefined
}

export type DreamCliColor = DreamCliForegroundColor | DreamCliBgColor

export type DreamCliForegroundColor =
  | 'black'
  | 'red'
  | 'redBright'
  | 'green'
  | 'greenBright'
  | 'yellow'
  | 'yellowBright'
  | 'blue'
  | 'blueBright'
  | 'magenta'
  | 'magentaBright'
  | 'cyan'
  | 'cyanBright'
  | 'white'
  | 'whiteBright'
  | 'gray'

export type DreamCliBgColor =
  | 'bgBlack'
  | 'bgRed'
  | 'bgRedBright'
  | 'bgGreen'
  | 'bgGreenBright'
  | 'bgYellow'
  | 'bgYellowBright'
  | 'bgBlue'
  | 'bgBlueBright'
  | 'bgMagenta'
  | 'bgMagentaBright'
  | 'bgCyan'
  | 'bgCyanBright'
  | 'bgWhite'
  | 'bgWhiteBright'
