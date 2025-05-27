import DreamSerializer from '../../../src/serializer/DreamSerializer.js'
import User from '../models/User.js'

export default (data: User) => UserSummarySerializer(data).attribute('name').attribute('birthdate')

export const UserSummarySerializer = (data: User) =>
  DreamSerializer(User, data).attribute('id').attribute('favoriteWord')
