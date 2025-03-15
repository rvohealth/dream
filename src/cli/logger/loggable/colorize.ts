import c from 'yoctocolors'
import { DreamCliBgColor, DreamCliForegroundColor } from '../DreamCliLogger.js'

export default function colorize(
  text: string,
  { color, bgColor }: { color?: DreamCliForegroundColor; bgColor?: DreamCliBgColor }
) {
  const foregroundApplied = color ? c[color](text) : text
  return bgColor ? c[bgColor](foregroundApplied) : foregroundApplied
}
