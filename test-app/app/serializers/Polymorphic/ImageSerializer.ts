import { DreamSerializer } from '../../../../src/index.js'
import Image from '../../models/Polymorphic/Image.js'

export const ImageSummarySerializer = (polymorphicImage: Image) =>
  DreamSerializer(Image, polymorphicImage).attribute('id')

export const ImageSerializer = (polymorphicImage: Image) =>
  ImageSummarySerializer(polymorphicImage).attribute('url')
