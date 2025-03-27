import c from 'yoctocolors'
import { DreamCliBgColor, DreamCliForegroundColor } from '../../../types/logger.js'

export default function colorize(
  text: string,
  {
    color,
    bgColor,
  }: {
    color?: DreamCliForegroundColor | undefined
    bgColor?: DreamCliBgColor | undefined
  }
) {
  const foregroundApplied = color ? c[color](text) : text
  return bgColor ? c[bgColor](foregroundApplied) : foregroundApplied
}
