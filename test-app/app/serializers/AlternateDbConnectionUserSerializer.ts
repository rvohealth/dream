import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import AlternateDbConnectionUser from '../models/AlternateDbConnectionUser.js'

export const AlternateDbConnectionUserSummarySerializer = (
  alternateDbConnectionUser: AlternateDbConnectionUser
) => DreamSerializer(AlternateDbConnectionUser, alternateDbConnectionUser).attribute('id')

export const AlternateDbConnectionUserSerializer = (alternateDbConnectionUser: AlternateDbConnectionUser) =>
  AlternateDbConnectionUserSummarySerializer(alternateDbConnectionUser).attribute('email').attribute('name')
