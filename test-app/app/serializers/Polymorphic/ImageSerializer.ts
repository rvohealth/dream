import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import Image from '../../models/Polymorphic/Image.js'

export const ImageSummarySerializer = (polymorphicImage: Image) =>
  DreamSerializer(Image, polymorphicImage).attribute('id')

export const ImageSerializer = (polymorphicImage: Image) =>
  ImageSummarySerializer(polymorphicImage).attribute('url')
