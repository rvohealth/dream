import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import User from '../models/User.js'

export default (data: User, passthroughData: object) =>
  DreamSerializer(User, data, passthroughData).attribute('id').attribute('name').attribute('birthdate')

export const UserSummarySerializer = (data: User, passthroughData: object) =>
  DreamSerializer(User, data, passthroughData).attribute('id').attribute('favoriteWord')
