import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import AlternateDbConnectionPost from '../models/AlternateDbConnectionPost.js'

export const AlternateDbConnectionPostSummarySerializer = (
  alternateDbConnectionPost: AlternateDbConnectionPost
) => DreamSerializer(AlternateDbConnectionPost, alternateDbConnectionPost).attribute('id')

export const AlternateDbConnectionPostSerializer = (alternateDbConnectionPost: AlternateDbConnectionPost) =>
  AlternateDbConnectionPostSummarySerializer(alternateDbConnectionPost).attribute('body')
