import colorfulLogo, { monochromeLogo } from './logos.js'

export default class DreamLogos {
  public static colorful() {
    return colorfulLogo()
  }

  public static monochrome() {
    return monochromeLogo()
  }
}
