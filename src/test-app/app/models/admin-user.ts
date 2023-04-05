import STI from '../../../decorators/STI'
import User from './user'

@STI()
export default class AdminUser extends User {}
